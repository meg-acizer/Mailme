import { NextResponse } from "next/server";
import {
  ALLOWED_API_KEY_SCOPES,
  generateTenantApiKey,
  type ApiKeyScope,
} from "@/lib/security/api-keys";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/security/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(`tenant:apikeys:${ip}`, 15, 60_000);
    if (!rl.allowed) return rateLimitResponse(rl.resetAt);

    const body = await request.json();
    const {
      tenantId = "11111111-1111-1111-1111-111111111111",
      name = "Integración n8n / Zapier",
      scopes = ["mail:read", "tasks:write"],
      rateLimitPerMin = 60,
    } = body as {
      tenantId?: string;
      name?: string;
      scopes?: string[];
      rateLimitPerMin?: number;
    };

    const validScopes = (Array.isArray(scopes) ? scopes : []).filter((s): s is ApiKeyScope =>
      ALLOWED_API_KEY_SCOPES.includes(s as ApiKeyScope)
    );

    if (validScopes.length === 0) {
      return NextResponse.json(
        { error: "Debes seleccionar al menos un scope válido." },
        { status: 400 }
      );
    }

    const { rawKey, keyPrefix, keyHash } = generateTenantApiKey();

    try {
      const supabase = createAdminClient();
      await supabase.from("tenant_api_keys").insert({
        tenant_id: tenantId,
        name: name.trim(),
        key_prefix: keyPrefix,
        key_hash: keyHash,
        scopes: validScopes,
        rate_limit_per_min: Math.max(10, Math.min(600, Number(rateLimitPerMin) || 60)),
      });
    } catch {
      // Non-fatal in local demo environment
    }

    // Return rawKey ONLY ONCE; only keyHash (SHA-256) is stored in DB
    return NextResponse.json({
      ok: true,
      rawKey,
      keyPrefix,
      keyHashPreview: `${keyHash.slice(0, 12)}...`,
      scopes: validScopes,
      createdAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error creando API Key";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
