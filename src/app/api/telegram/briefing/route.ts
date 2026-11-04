import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { TelegramBotClient, getTenantBotConfig } from "@/lib/telegram/bot";

export async function POST(req: NextRequest) {
  try {
    const { tenantId } = await req.json().catch(() => ({}));
    const targetTenantId = tenantId || "11111111-1111-1111-1111-111111111111";

    const config = await getTenantBotConfig(targetTenantId);
    if (!config || !config.enabled) {
      return NextResponse.json(
        { error: "Telegram bot not configured for this tenant" },
        { status: 400 }
      );
    }

    if (config.allowedIds.length === 0) {
      return NextResponse.json(
        { error: "No authorized Telegram IDs configured for this tenant" },
        { status: 400 }
      );
    }

    const bot = new TelegramBotClient(config.botToken);
    const sentResults = [];

    const now = new Date();
    const dateFormatted = now.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const briefingText =
      `🌅 *MailMe - Briefing Matutino*\n` +
      `📅 *${dateFormatted}*\n\n` +
      `⚡ *Resumen de Estado:*\n` +
      `• *3* correos no leídos de alta prioridad\n` +
      `• *2* reuniones programadas para hoy\n` +
      `• *0* alertas de seguridad o virus detectados\n\n` +
      `🎯 *Próximo compromiso:*\n` +
      `09:30 AM — *Sincronización semanal de producto*\n\n` +
      `_Escribe /hoy para ver tu lista completa o envía una nota de voz para responder correos._`;

    for (const tgId of config.allowedIds) {
      const res = await bot.sendMessage(tgId, briefingText);
      sentResults.push({ id: tgId, ok: !!res });
    }

    return NextResponse.json({
      success: true,
      sentTo: sentResults,
    });
  } catch (error: any) {
    console.error("[TelegramBriefing] Error dispatching briefing:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
