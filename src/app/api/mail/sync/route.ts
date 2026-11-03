import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptCredentials } from "@/lib/crypto";
import { fetchRecentImapEmails } from "@/lib/mail/imap";
import type { AccountCredentials } from "@/types/mail";

export async function POST(request: Request) {
  try {
    const { accountId, limit } = await request.json();

    if (!accountId) {
      return NextResponse.json({ error: "accountId es requerido" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: account, error: accError } = await supabase
      .from("accounts")
      .select("id, tenant_id, user_id, provider, email_address, credentials_encrypted")
      .eq("id", accountId)
      .single();

    if (accError || !account) {
      return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
    }

    // Set status to syncing
    await supabase.from("accounts").update({ sync_status: "syncing" }).eq("id", account.id);

    const decryptedJson = decryptCredentials(account.credentials_encrypted);
    const credentials: AccountCredentials = JSON.parse(decryptedJson);

    if (credentials.provider === "imap_smtp" && credentials.imap) {
      const messages = await fetchRecentImapEmails(credentials.imap, { limit: limit || 20 });

      // Insert or upsert emails into Supabase
      let insertedCount = 0;
      for (const msg of messages) {
        const { error: insertError } = await supabase.from("emails").upsert(
          {
            tenant_id: account.tenant_id,
            account_id: account.id,
            remote_msg_id: msg.remoteMsgId,
            thread_id: msg.threadId,
            from_address: msg.fromAddress,
            from_name: msg.fromName,
            to_addresses: msg.toAddresses,
            cc_addresses: msg.ccAddresses,
            subject: msg.subject,
            body_text: msg.bodyText,
            body_html_sanitized: msg.bodyHtml,
            date: msg.date.toISOString(),
            is_read: msg.isRead,
            is_flagged: msg.isFlagged,
            spf_dkim_status: "verified",
            triage_class: "info",
          },
          { onConflict: "tenant_id, remote_msg_id" }
        );

        if (!insertError) {
          insertedCount++;
        }
      }

      // Mark account as synced
      await supabase
        .from("accounts")
        .update({ sync_status: "idle", last_synced_at: new Date().toISOString() })
        .eq("id", account.id);

      return NextResponse.json({ success: true, count: insertedCount });
    }

    await supabase.from("accounts").update({ sync_status: "idle" }).eq("id", account.id);
    return NextResponse.json({ error: `Sincronización no disponible para ${credentials.provider}` }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error syncing emails";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
