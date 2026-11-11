import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptCredentials } from "@/lib/crypto";
import { sendMailViaSmtp } from "@/lib/mail/smtp";
import type { AccountCredentials, SendMailParams } from "@/types/mail";

export async function POST(request: Request) {
  try {
    const body: SendMailParams = await request.json();
    const { accountId, to, cc, bcc, subject, text, html, attachments } = body;

    if (!accountId || !to || to.length === 0 || !subject) {
      return NextResponse.json(
        { error: "Faltan campos requeridos (accountId, to, subject)" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data: account, error: accError } = await supabase
      .from("accounts")
      .select("id, tenant_id, user_id, provider, email_address, display_name, credentials_encrypted")
      .eq("id", accountId)
      .single();

    if (accError || !account) {
      return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
    }

    // 1. Fetch Tenant Security Policies & Corporate Assets
    const { data: tenant } = await supabase
      .from("tenants")
      .select("settings")
      .eq("id", account.tenant_id)
      .maybeSingle();

    const settings = (tenant?.settings as Record<string, unknown>) || {};
    const security = (settings.security_policies as any) || {};
    const blacklist: string[] = Array.isArray(security.blacklistDomains)
      ? security.blacklistDomains.map((d: string) => d.toLowerCase().trim())
      : [];
    const maxMb: number = Number(security.maxAttachmentSizeMb) || 25;

    // A. Check Blacklist Rule
    const allRecipients = [...to, ...(cc || []), ...(bcc || [])];
    for (const recipient of allRecipients) {
      const emailDomain = recipient.split("@")[1]?.toLowerCase().trim();
      if (emailDomain && blacklist.some((b) => emailDomain === b || emailDomain.endsWith("." + b))) {
        return NextResponse.json(
          {
            error: `Envío bloqueado por política de seguridad: el dominio "${emailDomain}" se encuentra en la lista negra corporativa.`,
          },
          { status: 403 }
        );
      }
    }

    // B. Check Max Attachment Size Rule
    if (attachments && attachments.length > 0) {
      const totalBytes = attachments.reduce((sum, att) => sum + (att.size || 0), 0);
      const totalMb = totalBytes / (1024 * 1024);
      if (totalMb > maxMb) {
        return NextResponse.json(
          {
            error: `Envío bloqueado por política de seguridad: los adjuntos suman ${totalMb.toFixed(1)}MB, superando el límite corporativo permitido de ${maxMb}MB.`,
          },
          { status: 400 }
        );
      }
    }

    // C. Append Corporate Signature if enabled
    let finalText = text || "";
    let finalHtml = html || "";
    const assets = (settings.corporate_assets as any) || {};
    if (assets.signatureTemplate) {
      const signatureFormatted = assets.signatureTemplate
        .replace("{nombre_completo}", account.display_name || account.email_address)
        .replace("{cargo}", "Colaborador")
        .replace("{email}", account.email_address);

      finalText = `${finalText}\n\n${signatureFormatted}`;
      finalHtml = `${finalHtml}<br><br><div class="corporate-signature" style="border-top:1px solid #e5e7eb;padding-top:8px;font-size:12px;color:#6b7280;">${signatureFormatted.replace(/\n/g, "<br>")}</div>`;
    }

    // 2. Decrypt credentials & Send
    const decryptedJson = decryptCredentials(account.credentials_encrypted);
    const credentials: AccountCredentials = JSON.parse(decryptedJson);

    let messageId = `<worvanta-${Date.now()}@worvanta.io>`;
    const fromHeader = `"${account.display_name || account.email_address}" <${account.email_address}>`;

    if (credentials.smtp) {
      // Works for imap_smtp, Google App Password (smtp.gmail.com), or Microsoft 365 SMTP (smtp.office365.com)
      const result = await sendMailViaSmtp(
        credentials.smtp,
        { accountId, to, cc, bcc, subject, text: finalText, html: finalHtml },
        fromHeader
      );
      messageId = result.messageId;
    } else if (credentials.provider === "microsoft" && credentials.oauth?.accessToken) {
      // Microsoft Graph API SendMail
      const graphRes = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${credentials.oauth.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            subject,
            body: {
              contentType: finalHtml ? "HTML" : "Text",
              content: finalHtml || finalText,
            },
            toRecipients: to.map((addr) => ({ emailAddress: { address: addr } })),
            ccRecipients: (cc || []).map((addr) => ({ emailAddress: { address: addr } })),
            bccRecipients: (bcc || []).map((addr) => ({ emailAddress: { address: addr } })),
          },
          saveToSentItems: true,
        }),
      });
      if (!graphRes.ok) {
        const errText = await graphRes.text();
        throw new Error(`Microsoft Graph Error: ${errText}`);
      }
    } else if (credentials.provider === "google" && credentials.oauth?.accessToken) {
      // Google Gmail REST API Send
      const rawMime = [
        `From: ${fromHeader}`,
        `To: ${to.join(", ")}`,
        ...(cc && cc.length > 0 ? [`Cc: ${cc.join(", ")}`] : []),
        `Subject: =?utf-8?B?${Buffer.from(subject).toString("base64")}?=`,
        "MIME-Version: 1.0",
        'Content-Type: text/html; charset="UTF-8"',
        "",
        finalHtml || finalText,
      ].join("\r\n");

      const encodedMessage = Buffer.from(rawMime)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      const gmailRes = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${credentials.oauth.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ raw: encodedMessage }),
        }
      );
      if (gmailRes.ok) {
        const gmailData = await gmailRes.json();
        messageId = gmailData.id || messageId;
      }
    }

    // Save a local record of the sent email in Supabase
    await supabase.from("emails").insert({
      tenant_id: account.tenant_id,
      account_id: account.id,
      remote_msg_id: messageId,
      from_address: account.email_address,
      from_name: account.display_name,
      to_addresses: to,
      cc_addresses: cc || [],
      subject,
      body_text: finalText,
      body_html_sanitized: finalHtml,
      date: new Date().toISOString(),
      is_read: true,
      triage_class: "info",
      spf_dkim_status: "verified",
    });

    return NextResponse.json({
      success: true,
      messageId,
      provider: credentials.provider,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error sending email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
