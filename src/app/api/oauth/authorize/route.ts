import { NextResponse } from "next/server";
import {
  buildOAuthAuthorizationUrl,
  createSignedOAuthState,
  type OAuthTarget,
} from "@/lib/oauth/providers";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/security/rate-limit";

export async function GET(request: Request) {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(`oauth:authorize:${ip}`, 20, 60_000);
    if (!rl.allowed) return rateLimitResponse(rl.resetAt);

    const { searchParams } = new URL(request.url);
    const target = (searchParams.get("target") || "microsoft_mail_calendar") as OAuthTarget;
    const tenantId = searchParams.get("tenantId") || "11111111-1111-1111-1111-111111111111";
    const userId = searchParams.get("userId") || "22222222-2222-2222-2222-222222222222";
    const emailHint = searchParams.get("email") || undefined;

    if (target !== "microsoft_mail_calendar" && target !== "google_calendar") {
      return NextResponse.json({ error: "Target OAuth no soportado" }, { status: 400 });
    }

    const state = createSignedOAuthState({ target, tenantId, userId, emailHint });
    const built = buildOAuthAuthorizationUrl({ target, state, emailHint });

    if (!built.configured) {
      return NextResponse.json(
        {
          configured: false,
          error: `Falta configurar ${built.missingVar} en las variables de entorno del servidor para iniciar el flujo OAuth real.`,
          missingVar: built.missingVar,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ configured: true, url: built.url });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error preparando flujo OAuth";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
