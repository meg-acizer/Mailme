import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptCredentials } from "@/lib/crypto";
import { TelegramBotClient } from "@/lib/telegram/bot";

export async function POST(req: NextRequest) {
  try {
    const { tenantSlug = "acme-corp", botToken, targetChatId } = await req.json();

    if (!targetChatId) {
      return NextResponse.json(
        { error: "Debe especificar un Telegram ID de destino para la prueba." },
        { status: 400 }
      );
    }

    let tokenToUse = (botToken || "").trim();

    // If token is masked or missing, fetch from Supabase
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

    // Extract numeric ID if input is like "123456789 (Carlos)"
    const cleanChatId = targetChatId.split(" ")[0].trim();

    const bot = new TelegramBotClient(tokenToUse);
    const testMessage =
      `🤖 *MailMe - Mensaje de Prueba*\n\n` +
      `¡Conexión exitosa! Tu bot corporativo de MailMe está correctamente vinculado y listo para procesar comandos y notas de voz.\n\n` +
      `_Enviado: ${new Date().toLocaleTimeString()} (Hora local)_`;

    const res = await bot.sendMessage(cleanChatId, testMessage);

    if (!res || !res.ok) {
      return NextResponse.json(
        {
          error: `Telegram rechazó el envío: ${res?.description || "Error de red o ID incorrecto. Asegúrate de haber iniciado una conversación con el bot escribiendo /start primero."}`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Mensaje de prueba enviado exitosamente a ${cleanChatId}.`,
      result: res.result,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
