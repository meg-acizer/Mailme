import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { encryptCredentials, decryptCredentials } from "@/lib/crypto";

function maskToken(token: string): string {
  if (!token || token.length < 10) return "••••••••";
  return token.slice(0, 6) + "••••••••" + token.slice(-5);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantSlug = searchParams.get("tenantSlug") || "acme-corp";

    const supabase = createAdminClient();
    const { data: tenant, error } = await supabase
      .from("tenants")
      .select("id, settings")
      .eq("slug", tenantSlug)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const settings = (tenant?.settings as Record<string, unknown>) || {};
    const tgSettings = (settings.telegram_bot as any) || {
      enabled: true,
      bot_token: "",
      bot_username: "@MailMeCorporateBot",
      allowed_ids: ["987654321 (meg-acizer)", "123456789 (Carlos CTO)"],
    };

    let maskedToken = "";
    if (tgSettings.bot_token) {
      try {
        const decrypted = decryptCredentials(tgSettings.bot_token);
        maskedToken = maskToken(decrypted);
      } catch {
        maskedToken = maskToken(tgSettings.bot_token);
      }
    }

    return NextResponse.json({
      success: true,
      config: {
        enabled: tgSettings.enabled ?? true,
        botToken: maskedToken,
        botUsername: tgSettings.bot_username || "",
        allowedIds: tgSettings.allowed_ids || [],
        webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://mailme.app"}/api/telegram/webhook?tenantId=${tenant?.id || "11111111-1111-1111-1111-111111111111"}`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantSlug = "acme-corp", botToken, botUsername, allowedIds, enabled } = body;

    const supabase = createAdminClient();
    const { data: tenant, error: fetchErr } = await supabase
      .from("tenants")
      .select("id, settings")
      .eq("slug", tenantSlug)
      .maybeSingle();

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 400 });
    }

    const existingSettings = (tenant?.settings as Record<string, unknown>) || {};
    const existingTg = (existingSettings.telegram_bot as any) || {};

    let encryptedToken = existingTg.bot_token || "";
    if (botToken && !botToken.includes("••••")) {
      encryptedToken = encryptCredentials(botToken.trim());
    }

    const newTgSettings = {
      enabled: enabled ?? true,
      bot_token: encryptedToken,
      bot_username: botUsername || existingTg.bot_username || "",
      allowed_ids: allowedIds || existingTg.allowed_ids || [],
      updated_at: new Date().toISOString(),
    };

    const newSettings = {
      ...existingSettings,
      telegram_bot: newTgSettings,
    };

    if (tenant) {
      const { error: updateErr } = await supabase
        .from("tenants")
        .update({ settings: newSettings, updated_at: new Date().toISOString() })
        .eq("id", tenant.id);

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 400 });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Configuración de Telegram cifrada y guardada en Supabase.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
