import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptCredentials } from "@/lib/crypto";

export async function POST(req: NextRequest) {
  try {
    const { tenantSlug = "acme-corp", botToken, webhookUrl } = await req.json();

    let tokenToUse = (botToken || "").trim();

    if (!tokenToUse || tokenToUse.includes("••••")) {
      const supabase = createAdminClient();
      const { data: tenant } = await supabase
        .from("tenants")
        .select("settings")
        .eq("slug", tenantSlug)
        .maybeSingle();

      const tgSettings = (tenant?.settings as any)?.telegram_bot;
      if (tgSettings?.bot_token) {
        tokenToUse = decryptCredentials(tgSettings.bot_token);
      }
    }

    if (!tokenToUse || tokenToUse.length < 15) {
      return NextResponse.json(
        { error: "Bot Token de Telegram no configurado o inválido." },
        { status: 400 }
      );
    }

    const targetWebhook =
      webhookUrl ||
      `${process.env.NEXT_PUBLIC_APP_URL || "https://mailme.app"}/api/telegram/webhook?tenantId=11111111-1111-1111-1111-111111111111`;

    // 1. Call Telegram getMe to verify bot token and get bot username
    const meRes = await fetch(`https://api.telegram.org/bot${tokenToUse}/getMe`);
    const meData = await meRes.json();

    if (!meData.ok) {
      return NextResponse.json(
        { error: `Token inválido según Telegram: ${meData.description}` },
        { status: 400 }
      );
    }

    // 2. Call setWebhook
    const setRes = await fetch(
      `https://api.telegram.org/bot${tokenToUse}/setWebhook?url=${encodeURIComponent(targetWebhook)}`
    );
    const setData = await setRes.json();

    // 3. Call getWebhookInfo
    const infoRes = await fetch(`https://api.telegram.org/bot${tokenToUse}/getWebhookInfo`);
    const infoData = await infoRes.json();

    return NextResponse.json({
      success: true,
      bot: meData.result,
      setWebhookResult: setData,
      webhookInfo: infoData.result,
      message: `Webhook configurado con éxito para @${meData.result.username}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
