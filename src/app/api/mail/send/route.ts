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

    if (credentials.provider === "imap_smtp" && credentials.smtp) {
      const fromHeader = `"${account.display_name || account.email_address}" <${account.email_address}>`;
      const result = await sendMailViaSmtp(
        credentials.smtp,
        { accountId, to, cc, bcc, subject, text: finalText, html: finalHtml },
        fromHeader
      );

      // Save a local record of the sent email in Supabase
      await supabase.from("emails").insert({
        tenant_id: account.tenant_id,
        account_id: account.id,
        remote_msg_id: result.messageId,
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

      return NextResponse.json({ success: true, messageId: result.messageId });
    }

    return NextResponse.json(
      { error: `Envío no implementado para proveedor ${credentials.provider}` },
      { status: 400 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error sending email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
