import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import type { ImapConfig, ParsedEmailMessage } from "@/types/mail";
import { sanitizeEmailHtml } from "./sanitizer";
import { evaluateEmailAntispam } from "./antispam";
import { assertSafeMailServer } from "./ssrf";

export async function verifyImapConnection(config: ImapConfig): Promise<boolean> {
  await assertSafeMailServer(config.host, config.port, "imap");
  const client = new ImapFlow({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    logger: false,
  });

  try {
    await client.connect();
    await client.logout();
    return true;
  } catch (error) {
    console.error("IMAP connection verification failed:", error);
    throw error;
  }
}

export async function fetchRecentImapEmails(
  config: ImapConfig,
  options: { folder?: string; limit?: number; blacklistDomains?: string[] } = {}
): Promise<ParsedEmailMessage[]> {
  await assertSafeMailServer(config.host, config.port, "imap");
  const folder = options.folder || "INBOX";
  const limit = options.limit || 30;

  const client = new ImapFlow({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    logger: false,
  });

  await client.connect();

  const messages: ParsedEmailMessage[] = [];

  try {
    const lock = await client.getMailboxLock(folder);
    try {
      // Calculate sequence range for the last N messages
      const status = client.mailbox;
      if (!status || status.exists === 0) {
        return [];
      }

      const total = status.exists;
      const startSeq = Math.max(1, total - limit + 1);
      const seqRange = `${startSeq}:${total}`;

      for await (const message of client.fetch(seqRange, { source: true, envelope: true })) {
        if (!message.source) continue;

        const parsed = await simpleParser(message.source);
        const rawHtml = parsed.html || parsed.textAsHtml || "";
        const { sanitizedHtml } = sanitizeEmailHtml(rawHtml);

        const fromAddress = parsed.from?.value[0]?.address || "unknown@domain.com";
        const fromName = parsed.from?.value[0]?.name || fromAddress;

        const toAddresses = parsed.to
          ? Array.isArray(parsed.to)
            ? parsed.to.flatMap((t) => t.value.map((v) => v.address || ""))
            : parsed.to.value.map((v) => v.address || "")
          : [];

        const ccAddresses = parsed.cc
          ? Array.isArray(parsed.cc)
            ? parsed.cc.flatMap((c) => c.value.map((v) => v.address || ""))
            : parsed.cc.value.map((v) => v.address || "")
          : [];

        const authResultsVal = parsed.headers.get("authentication-results");
        const receivedSpfVal = parsed.headers.get("received-spf");
        const dkimSigVal = parsed.headers.get("dkim-signature");

        const antispam = evaluateEmailAntispam({
          fromAddress,
          authenticationResultsHeader: typeof authResultsVal === "string" ? authResultsVal : String(authResultsVal || ""),
          receivedSpfHeader: typeof receivedSpfVal === "string" ? receivedSpfVal : String(receivedSpfVal || ""),
          dkimSignatureHeader: typeof dkimSigVal === "string" ? dkimSigVal : String(dkimSigVal || ""),
          blacklistDomains: options.blacklistDomains,
          subject: parsed.subject,
        });

        messages.push({
          remoteMsgId: parsed.messageId || `${message.uid}-${Date.now()}`,
          threadId: parsed.inReplyTo || undefined,
          fromAddress,
          fromName,
          toAddresses,
          ccAddresses,
          subject: parsed.subject || "(Sin asunto)",
          bodyText: parsed.text || "",
          bodyHtml: sanitizedHtml,
          date: parsed.date || new Date(),
          isRead: message.flags?.has("\\Seen") || false,
          isFlagged: message.flags?.has("\\Flagged") || false,
          attachmentsCount: parsed.attachments ? parsed.attachments.length : 0,
          spfDkimStatus: antispam.spfDkimStatus,
          isSpamOrBlacklisted: antispam.isSpamSuspected,
        });
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }

  // Return sorted newest to oldest
  return messages.sort((a, b) => b.date.getTime() - a.date.getTime());
}
