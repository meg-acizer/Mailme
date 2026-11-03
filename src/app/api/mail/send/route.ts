import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptCredentials } from "@/lib/crypto";
import { sendMailViaSmtp } from "@/lib/mail/smtp";
import type { AccountCredentials, SendMailParams } from "@/types/mail";

export async function POST(request: Request) {
  try {
    const body: SendMailParams = await request.json();
    const { accountId, to, cc, bcc, subject, text, html } = body;

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

    // Decrypt credentials
    const decryptedJson = decryptCredentials(account.credentials_encrypted);
    const credentials: AccountCredentials = JSON.parse(decryptedJson);

    if (credentials.provider === "imap_smtp" && credentials.smtp) {
      const fromHeader = `"${account.display_name || account.email_address}" <${account.email_address}>`;
      const result = await sendMailViaSmtp(credentials.smtp, { accountId, to, cc, bcc, subject, text, html }, fromHeader);

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
        body_text: text || "",
        body_html_sanitized: html || "",
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
