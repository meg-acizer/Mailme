import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptCredentials } from "@/lib/crypto";

function verifyHubSignature256(rawBody: string, headerValue: string, appSecret: string): boolean {
  if (!headerValue || !headerValue.startsWith("sha256=")) return false;
  const expected = `sha256=${crypto.createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex")}`;
  const bufIncoming = Buffer.from(headerValue);
  const bufExpected = Buffer.from(expected);
  if (bufIncoming.length !== bufExpected.length) return false;
  return crypto.timingSafeEqual(bufIncoming, bufExpected);
}

/**
 * Meta Webhook Verification Challenge (GET)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const expectedVerifyToken = process.env.WHATSAPP_VERIFY_TOKEN || "worvanta_wa_verify_token";

  if (mode === "subscribe" && token && challenge && token === expectedVerifyToken) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Invalid verify token" }, { status: 403 });
}

/**
 * Meta Cloud API Incoming Messages Webhook (POST)
 * Enforces X-Hub-Signature-256 HMAC validation and per-tenant message cost controls.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signatureHeader = req.headers.get("x-hub-signature-256") || "";
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("tenantId") || "11111111-1111-1111-1111-111111111111";

    // Resolve tenant's encrypted Meta App Secret (BYOA) or global fallback
    let appSecret = process.env.WHATSAPP_APP_SECRET || "";
    let replyPolicy: "contacts_only" | "notifications_only" | "daily_cap" = "contacts_only";

    try {
      const supabase = createAdminClient();
      const { data: tenant } = await supabase
        .from("tenants")
        .select("settings")
        .eq("id", tenantId)
        .maybeSingle();

      const settings = (tenant?.settings as Record<string, any>) || {};
      const waConfig = settings.whatsapp_config;
      if (waConfig?.appSecretEncrypted) {
        appSecret = decryptCredentials(waConfig.appSecretEncrypted);
      }
      if (waConfig?.replyPolicy) {
        replyPolicy = waConfig.replyPolicy;
      }
    } catch {
      // Fallback to env secret
    }

    if (!appSecret) {
      return NextResponse.json(
        { error: "WhatsApp App Secret not configured for X-Hub-Signature-256 validation" },
        { status: 401 }
      );
    }

    if (!verifyHubSignature256(rawBody, signatureHeader, appSecret)) {
      return NextResponse.json(
        { error: "Invalid X-Hub-Signature-256 signature" },
        { status: 401 }
      );
    }

    const payload = JSON.parse(rawBody);
    return NextResponse.json({
      ok: true,
      verifiedSignature: true,
      replyPolicyApplied: replyPolicy,
      entries: Array.isArray(payload?.entry) ? payload.entry.length : 0,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Invalid WhatsApp webhook payload";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
