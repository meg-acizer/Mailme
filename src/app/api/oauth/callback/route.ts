import { NextResponse } from "next/server";
import {
  exchangeOAuthCode,
  getAppBaseUrl,
  verifySignedOAuthState,
} from "@/lib/oauth/providers";
import { encryptCredentials } from "@/lib/crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const baseUrl = getAppBaseUrl();
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const oauthError = searchParams.get("error");

    if (oauthError) {
      return NextResponse.redirect(`${baseUrl}/?oauth_error=${encodeURIComponent(oauthError)}`);
    }
    if (!code || !state) {
      return NextResponse.redirect(`${baseUrl}/?oauth_error=missing_code_or_state`);
    }

    const verifiedState = verifySignedOAuthState(state);
    const tokens = await exchangeOAuthCode({
      target: verifiedState.target,
      code,
    });

    const encrypted = encryptCredentials(
      JSON.stringify({
        target: verifiedState.target,
        oauth: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: Date.now() + tokens.expiresIn * 1000,
        },
      })
    );

    try {
      const supabase = createAdminClient();
      if (verifiedState.target === "microsoft_mail_calendar") {
        await supabase.from("accounts").insert({
          tenant_id: verifiedState.tenantId,
          user_id: verifiedState.userId,
          provider: "microsoft",
          email_address: verifiedState.emailHint || "cuenta@microsoft365.com",
          display_name: "Microsoft 365 (OAuth 2.0)",
          color_tag: "#f97316",
          credentials_encrypted: encrypted,
          sync_status: "idle",
        });
      } else if (verifiedState.target === "google_calendar") {
        await supabase.from("calendars").insert({
          tenant_id: verifiedState.tenantId,
          user_id: verifiedState.userId,
          name: "Google Calendar (OAuth 2.0)",
          color: "#3b82f6",
          is_primary: false,
        });
      }
    } catch {
      // Non-fatal if running in local demo mode without DB seeded
    }

    return NextResponse.redirect(
      `${baseUrl}/?oauth_connected=${encodeURIComponent(verifiedState.target)}`
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "oauth_callback_failed";
    return NextResponse.redirect(`${baseUrl}/?oauth_error=${encodeURIComponent(msg)}`);
  }
}
