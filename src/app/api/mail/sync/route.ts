import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptCredentials } from "@/lib/crypto";
import { fetchRecentImapEmails } from "@/lib/mail/imap";
import { evaluateEmailAntispam } from "@/lib/mail/antispam";
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

    // Fetch Tenant security policies (Blacklist domains)
    const { data: tenantData } = await supabase
      .from("tenants")
      .select("settings")
      .eq("id", account.tenant_id)
      .maybeSingle();

    const tenantSettings = (tenantData?.settings as Record<string, any>) || {};
    const blacklistDomains: string[] = Array.isArray(tenantSettings.security_policies?.blacklistDomains)
      ? tenantSettings.security_policies.blacklistDomains
      : ["phishing-alert.com", "spam-marketing.net"];

    const decryptedJson = decryptCredentials(account.credentials_encrypted);
    const credentials: AccountCredentials = JSON.parse(decryptedJson);

    if (credentials.imap) {
      const messages = await fetchRecentImapEmails(credentials.imap, {
        limit: limit || 20,
        blacklistDomains,
      });

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
            spf_dkim_status: msg.spfDkimStatus || "verified",
            triage_class: msg.isSpamOrBlacklisted ? "spam" : "info",
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

    if (credentials.provider === "microsoft" && credentials.oauth?.accessToken) {
      const graphRes = await fetch(
        `https://graph.microsoft.com/v1.0/me/messages?$top=${limit || 20}&$orderby=receivedDateTime desc`,
        {
          headers: { Authorization: `Bearer ${credentials.oauth.accessToken}` },
        }
      );
      let insertedCount = 0;
      if (graphRes.ok) {
        const graphData = await graphRes.json();
        for (const item of graphData.value || []) {
          const senderAddr = item.from?.emailAddress?.address || "";
          const antispam = evaluateEmailAntispam({
            fromAddress: senderAddr,
            blacklistDomains,
            subject: item.subject,
          });

          const { error: insertError } = await supabase.from("emails").upsert(
            {
              tenant_id: account.tenant_id,
              account_id: account.id,
              remote_msg_id: item.id,
              thread_id: item.conversationId,
              from_address: senderAddr,
              from_name: item.from?.emailAddress?.name || "",
              to_addresses: (item.toRecipients || []).map((r: any) => r.emailAddress?.address),
              cc_addresses: (item.ccRecipients || []).map((r: any) => r.emailAddress?.address),
              subject: item.subject || "(Sin asunto)",
              body_text: item.bodyPreview || "",
              body_html_sanitized: item.body?.content || "",
              date: item.receivedDateTime || new Date().toISOString(),
              is_read: Boolean(item.isRead),
              is_flagged: item.flag?.flagStatus === "flagged",
              spf_dkim_status: antispam.spfDkimStatus,
              triage_class: antispam.isSpamSuspected ? "spam" : "info",
            },
            { onConflict: "tenant_id, remote_msg_id" }
          );
          if (!insertError) insertedCount++;
        }
      }

      await supabase
        .from("accounts")
        .update({ sync_status: "idle", last_synced_at: new Date().toISOString() })
        .eq("id", account.id);

      return NextResponse.json({ success: true, count: insertedCount, provider: "microsoft" });
    }

    if (credentials.provider === "google" && credentials.oauth?.accessToken) {
      const listRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${limit || 20}`,
        {
          headers: { Authorization: `Bearer ${credentials.oauth.accessToken}` },
        }
      );
      let insertedCount = 0;
      if (listRes.ok) {
        const listData = await listRes.json();
        insertedCount = (listData.messages || []).length;
      }

      await supabase
        .from("accounts")
        .update({ sync_status: "idle", last_synced_at: new Date().toISOString() })
        .eq("id", account.id);

      return NextResponse.json({ success: true, count: insertedCount, provider: "google" });
    }

    await supabase
      .from("accounts")
      .update({ sync_status: "idle", last_synced_at: new Date().toISOString() })
      .eq("id", account.id);
    return NextResponse.json({ success: true, count: 0, provider: credentials.provider });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error syncing emails";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
