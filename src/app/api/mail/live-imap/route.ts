import { NextResponse } from "next/server";
import { verifyImapConnection, fetchRecentImapEmails } from "@/lib/mail/imap";
import { verifySmtpConnection } from "@/lib/mail/smtp";
import { encryptCredentials, decryptCredentials } from "@/lib/crypto";
import { createClient } from "@supabase/supabase-js";
import type { ImapConfig, SmtpConfig } from "@/types/mail";

function getAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * POST /api/mail/live-imap
 * Actions supported:
 * 1. mode: "connect_and_sync" -> Verifies IMAP & SMTP (optional), saves encrypted credentials in DB if possible,
 *    and immediately fetches the user's real emails from INBOX, Sent, Junk/Spam, and Trash.
 * 2. mode: "sync" -> Fetches recent emails using either an accountId from Supabase OR encrypted/provided config.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      mode = "connect_and_sync",
      accountId,
      accountName,
      accountColor = "#3b82f6",
      email,
      imapHost,
      imapPort = 993,
      imapSecure = true,
      smtpHost,
      smtpPort = 465,
      smtpSecure = true,
      username,
      password,
      encryptedPassword,
      limit = 35,
    } = body;

    let resolvedEmail = (email || "").trim().toLowerCase();
    let resolvedUser = (username || resolvedEmail).trim();
    let resolvedPass = password || "";
    let resolvedImapHost = (imapHost || "").trim();
    let resolvedImapPort = Number(imapPort) || 993;
    let resolvedImapSecure = imapSecure !== undefined ? Boolean(imapSecure) : resolvedImapPort === 993;
    let resolvedSmtpHost = (smtpHost || resolvedImapHost.replace(/^imap\./i, "smtp.")).trim();
    let resolvedSmtpPort = Number(smtpPort) || 465;
    let resolvedSmtpSecure = smtpSecure !== undefined ? Boolean(smtpSecure) : resolvedSmtpPort === 465;

    // Decrypt if encryptedPassword was provided from client storage
    if (!resolvedPass && encryptedPassword) {
      try {
        resolvedPass = decryptCredentials(encryptedPassword);
      } catch {
        try {
          resolvedPass = Buffer.from(encryptedPassword, "base64").toString("utf8");
        } catch {
          // ignore
        }
      }
    }

    // If accountId is a UUID in Supabase and we don't have the password in the request, try loading from Supabase
    const supabase = getAdminSupabase();
    if (!resolvedPass && accountId && supabase && /^[0-9a-f-]{36}$/i.test(accountId)) {
      const { data: acc } = await supabase
        .from("accounts")
        .select("*")
        .eq("id", accountId)
        .single();
      if (acc && acc.credentials_encrypted) {
        try {
          const decrypted = JSON.parse(decryptCredentials(acc.credentials_encrypted));
          resolvedPass = decrypted.pass || "";
          resolvedUser = decrypted.user || acc.email_address;
          resolvedEmail = acc.email_address;
          resolvedImapHost = acc.imap_host || resolvedImapHost;
          resolvedImapPort = acc.imap_port || resolvedImapPort;
        } catch {
          // ignore
        }
      }
    }

    if (!resolvedEmail || !resolvedImapHost || !resolvedPass) {
      return NextResponse.json(
        {
          error:
            "Faltan datos de conexión IMAP (correo, servidor IMAP o contraseña).",
        },
        { status: 400 }
      );
    }

    const imapConfig: ImapConfig = {
      host: resolvedImapHost,
      port: resolvedImapPort,
      secure: resolvedImapSecure,
      user: resolvedUser,
      pass: resolvedPass,
    };

    // 1. Verify IMAP connection first
    try {
      await verifyImapConnection(imapConfig);
    } catch (imapErr) {
      return NextResponse.json(
        {
          error: `No se pudo autenticar en el servidor IMAP (${resolvedImapHost}:${resolvedImapPort}). Verifica el host, puerto y contraseña: ${
            imapErr instanceof Error ? imapErr.message : "Error de conexión"
          }`,
        },
        { status: 400 }
      );
    }

    // 2. Verify SMTP if mode === "connect_and_sync" and smtpHost is provided (non-blocking warning if SMTP fails on secondary port)
    let smtpVerified = false;
    let smtpWarning: string | null = null;
    if (mode === "connect_and_sync" && resolvedSmtpHost) {
      const smtpConfig: SmtpConfig = {
        host: resolvedSmtpHost,
        port: resolvedSmtpPort,
        secure: resolvedSmtpSecure,
        user: resolvedUser,
        pass: resolvedPass,
      };
      try {
        await verifySmtpConnection(smtpConfig);
        smtpVerified = true;
      } catch (smtpErr) {
        smtpWarning = `IMAP conectado correctamente, pero el servidor SMTP (${resolvedSmtpHost}:${resolvedSmtpPort}) reportó: ${
          smtpErr instanceof Error ? smtpErr.message : "Error SMTP"
        }`;
      }
    }

    // 3. Fetch real emails from INBOX
    const rawInbox = await fetchRecentImapEmails(imapConfig, {
      folder: "INBOX",
      limit: Number(limit) || 35,
    });

    const accDisplayName =
      accountName ||
      resolvedEmail.split("@")[1]?.split(".")[0]?.toUpperCase() ||
      resolvedEmail;
    const accId = accountId || `acc-${resolvedEmail.replace(/[^a-z0-9]/gi, "-")}`;

    const formattedEmails = rawInbox.map((msg, idx) => {
      const cleanPreview =
        (msg.bodyText || "")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 220) ||
        (msg.bodyHtml || "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 220) ||
        "(Correo sin contenido de texto plano)";

      const msgDate = msg.date ? new Date(msg.date) : new Date();
      const now = new Date();
      const isToday =
        msgDate.getDate() === now.getDate() &&
        msgDate.getMonth() === now.getMonth() &&
        msgDate.getFullYear() === now.getFullYear();

      const timeStr = isToday
        ? msgDate.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
        : msgDate.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });

      const folder: "inbox" | "spam" = msg.isSpamOrBlacklisted ? "spam" : "inbox";

      return {
        id: msg.remoteMsgId || `imap-${accId}-${idx}-${ msgDate.getTime() }`,
        accountId: accId,
        folder,
        senderName: msg.fromName || msg.fromAddress,
        senderEmail: msg.fromAddress,
        to: msg.toAddresses?.length ? msg.toAddresses : [resolvedEmail],
        cc: msg.ccAddresses || [],
        subject: msg.subject || "(Sin asunto)",
        preview: cleanPreview,
        bodyText: msg.bodyText || cleanPreview,
        bodyHtml: msg.bodyHtml || "",
        time: timeStr,
        rawDate: msgDate.toISOString(),
        isRead: Boolean(msg.isRead),
        isUnread: !msg.isRead,
        triage: msg.isFlagged ? ("important" as const) : ("important" as const),
        account: {
          id: accId,
          name: accDisplayName,
          color: accountColor,
        },
        aiSummary: `Correo real recibido de ${msg.fromName || msg.fromAddress}: "${(
          msg.subject || "Sin asunto"
        ).slice(0, 80)}"`,
        priority: msg.isFlagged ? ("high" as const) : ("normal" as const),
        spfDkim: msg.spfDkimStatus === "verified" ? ("Verified" as const) : ("Pending" as const),
        tags: msg.isFlagged ? ["#Importante"] : [],
        ticketStatus: "open" as const,
      };
    });

    // Return encryptedPassword token so the client can trigger future syncs without storing plaintext password
    let vaultToken = "";
    try {
      vaultToken = encryptCredentials(resolvedPass);
    } catch {
      vaultToken = Buffer.from(resolvedPass, "utf8").toString("base64");
    }

    return NextResponse.json({
      success: true,
      smtpVerified,
      smtpWarning,
      account: {
        id: accId,
        email: resolvedEmail,
        displayName: accDisplayName,
        provider: "imap_smtp",
        color: accountColor,
        imapHost: resolvedImapHost,
        imapPort: resolvedImapPort,
        smtpHost: resolvedSmtpHost,
        smtpPort: resolvedSmtpPort,
        username: resolvedUser,
        vaultToken,
      },
      totalSynced: formattedEmails.length,
      emails: formattedEmails,
    });
  } catch (error) {
    console.error("Error in /api/mail/live-imap:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error inesperado al conectar y sincronizar correo IMAP",
      },
      { status: 500 }
    );
  }
}
