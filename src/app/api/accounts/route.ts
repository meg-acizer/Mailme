import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { encryptCredentials } from "@/lib/crypto";
import { verifyImapConnection } from "@/lib/mail/imap";
import { verifySmtpConnection } from "@/lib/mail/smtp";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/security/rate-limit";
import type { AccountCredentials } from "@/types/mail";

export async function GET(request: Request) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");

    let query = supabase.from("accounts").select("id, tenant_id, user_id, provider, email_address, display_name, sync_status, color_tag, last_synced_at, created_at");

    if (tenantId) {
      query = query.eq("tenant_id", tenantId);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ accounts: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error listing accounts";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(`accounts:post:${ip}`, 15, 60_000);
    if (!rl.allowed) return rateLimitResponse(rl.resetAt);

    const body = await request.json();
    const { tenantId, userId, provider, email, displayName, colorTag, imap, smtp } = body;

    if (!tenantId || !userId || !email || !provider) {
      return NextResponse.json({ error: "Faltan campos requeridos (tenantId, userId, email, provider)" }, { status: 400 });
    }

    // If IMAP/SMTP is provided, test the connections before saving!
    if (provider === "imap_smtp" && imap && smtp) {
      try {
        await verifyImapConnection(imap);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error";
        return NextResponse.json({ error: `Fallo al conectar al servidor IMAP: ${msg}` }, { status: 422 });
      }

      try {
        await verifySmtpConnection(smtp);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error";
        return NextResponse.json({ error: `Fallo al conectar al servidor SMTP: ${msg}` }, { status: 422 });
      }
    }

    // Encrypt credentials payload with AES-256-GCM
    const credentialsPayload: AccountCredentials = {
      provider,
      email,
      displayName: displayName || email,
      colorTag: colorTag || "#3b82f6",
      imap,
      smtp,
    };

    const encryptedCredentials = encryptCredentials(JSON.stringify(credentialsPayload));

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("accounts")
      .insert({
        tenant_id: tenantId,
        user_id: userId,
        provider,
        email_address: email,
        display_name: displayName || email,
        credentials_encrypted: encryptedCredentials,
        color_tag: colorTag || "#3b82f6",
        sync_status: "idle",
      })
      .select("id, email_address, display_name, provider, color_tag")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, account: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
