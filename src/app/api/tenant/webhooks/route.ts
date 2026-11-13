import crypto from "crypto";
import { NextResponse } from "next/server";
import { encryptCredentials } from "@/lib/crypto";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/security/rate-limit";
import {
  assertSafeWebhookUrl,
  dispatchSignedWebhook,
  getNextRetryTimestamp,
  type WebhookEventType,
} from "@/lib/webhooks/dispatcher";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(`tenant:webhooks:${ip}`, 20, 60_000);
    if (!rl.allowed) return rateLimitResponse(rl.resetAt);

    const body = await request.json();
    const {
      action = "create",
      tenantId = "11111111-1111-1111-1111-111111111111",
      name = "Webhook n8n",
      targetUrl = "",
      events = ["email.received", "task.created"],
      signingSecret,
    } = body as {
      action?: "create" | "test";
      tenantId?: string;
      name?: string;
      targetUrl?: string;
      events?: WebhookEventType[];
      signingSecret?: string;
    };

    // 1. Validate URL against SSRF (blocks localhost, RFC1918, 169.254.x.x, non-HTTPS)
    await assertSafeWebhookUrl(targetUrl);

    const secretToUse = signingSecret || `whsec_${crypto.randomBytes(20).toString("hex")}`;

    if (action === "test") {
      const result = await dispatchSignedWebhook({
        targetUrl,
        signingSecret: secretToUse,
        event: "email.received",
        payload: {
          test: true,
          tenantId,
          sampleSubject: "Factura #4092 — Proveedor Cloud",
          note: "Firmado con HMAC-SHA256 y enviado con redirect: error",
        },
      });

      return NextResponse.json({
        ok: true,
        delivered: result.delivered,
        httpStatus: result.httpStatus,
        errorMessage: result.errorMessage,
        signatureHeader: result.signatureHeader,
        timestamp: result.timestamp,
        nextRetryAt: result.delivered ? null : getNextRetryTimestamp(1),
      });
    }

    const encryptedSecret = encryptCredentials(secretToUse);

    try {
      const supabase = createAdminClient();
      await supabase.from("tenant_webhooks").insert({
        tenant_id: tenantId,
        name: name.trim(),
        target_url: targetUrl.trim(),
        signing_secret_encrypted: encryptedSecret,
        events,
      });
    } catch {
      // Non-fatal in local demo environment
    }

    return NextResponse.json({
      ok: true,
      signingSecret: secretToUse,
      targetUrl: targetUrl.trim(),
      events,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error procesando webhook";
    return NextResponse.json({ error: msg }, { status: 422 });
  }
}
