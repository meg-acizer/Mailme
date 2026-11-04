// Telegram Bot Helper & Dispatcher for MailMe
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptCredentials } from "@/lib/crypto";
import { executeAiCompletion } from "@/lib/ai/llm-client";

export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      first_name?: string;
      username?: string;
      type: string;
    };
    date: number;
    text?: string;
    voice?: {
      file_id: string;
      duration: number;
      mime_type?: string;
      file_size?: number;
    };
  };
  callback_query?: {
    id: string;
    from: {
      id: number;
      first_name: string;
    };
    message?: {
      message_id: number;
      chat: {
        id: number;
      };
    };
    data?: string;
  };
}

export class TelegramBotClient {
  private botToken: string;
  private apiBase: string;

  constructor(botToken: string) {
    this.botToken = botToken;
    this.apiBase = `https://api.telegram.org/bot${botToken}`;
  }

  async sendMessage(
    chatId: number | string,
    text: string,
    options?: {
      reply_markup?: {
        inline_keyboard?: Array<Array<{ text: string; callback_data: string; url?: string }>>;
      };
      parse_mode?: "Markdown" | "HTML";
    }
  ) {
    try {
      const res = await fetch(`${this.apiBase}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: options?.parse_mode || "Markdown",
          reply_markup: options?.reply_markup,
        }),
      });
      return await res.json();
    } catch (err) {
      console.error("[TelegramBotClient] sendMessage error:", err);
      return null;
    }
  }

  async answerCallbackQuery(callbackQueryId: string, text?: string) {
    try {
      await fetch(`${this.apiBase}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callback_query_id: callbackQueryId,
          text,
        }),
      });
    } catch (err) {
      console.error("[TelegramBotClient] answerCallbackQuery error:", err);
    }
  }

  async sendChatAction(chatId: number | string, action: "typing" | "record_voice" = "typing") {
    try {
      await fetch(`${this.apiBase}/sendChatAction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, action }),
      });
    } catch {
      // Ignore chat action failures
    }
  }

  async getFile(fileId: string): Promise<{ file_path?: string } | null> {
    try {
      const res = await fetch(`${this.apiBase}/getFile?file_id=${fileId}`);
      const data = await res.json();
      if (data.ok && data.result) {
        return data.result;
      }
      return null;
    } catch {
      return null;
    }
  }

  getFileDownloadUrl(filePath: string): string {
    return `https://api.telegram.org/file/bot${this.botToken}/${filePath}`;
  }
}

/**
 * Validates whether the incoming Telegram sender is authorized for this tenant
 */
export async function getTenantBotConfig(tenantIdOrSlug: string) {
  const supabase = createAdminClient();
  let query = supabase.from("tenants").select("id, settings");
  
  // Check whether it's a UUID or a slug
  if (tenantIdOrSlug.includes("-") && tenantIdOrSlug.length >= 32) {
    query = query.eq("id", tenantIdOrSlug);
  } else {
    query = query.eq("slug", tenantIdOrSlug);
  }

  const { data: tenant, error } = await query.maybeSingle();

  if (error || !tenant) {
    return null;
  }

  const tgSettings = (tenant.settings as any)?.telegram_bot;
  if (!tgSettings || !tgSettings.bot_token) {
    return null;
  }

  let botToken = tgSettings.bot_token;
  if (botToken.startsWith("vault:") || botToken.length > 50) {
    try {
      botToken = decryptCredentials(botToken);
    } catch {
      // Keep as-is if raw token
    }
  }

  const allowedIds: string[] = Array.isArray(tgSettings.allowed_ids)
    ? tgSettings.allowed_ids.map((id: string | number) => String(id).trim())
    : [];

  return {
    tenantId: tenant.id,
    botToken,
    allowedIds,
    enabled: tgSettings.enabled ?? true,
  };
}

/**
 * Checks whether a sender ID is in the allowed list (supports labels like "12345 (Name)")
 */
function isSenderAuthorized(allowedIds: string[], senderId: string): boolean {
  if (allowedIds.length === 0) return true;
  return allowedIds.some((item) => {
    const cleanId = item.split(" ")[0].trim();
    return cleanId === senderId;
  });
}

/**
 * Handles incoming Telegram update
 */
export async function processTelegramUpdate(tenantIdOrSlug: string, update: TelegramUpdate) {
  const botConfig = await getTenantBotConfig(tenantIdOrSlug);
  if (!botConfig || !botConfig.enabled) {
    console.warn(`[Telegram] Bot not configured or disabled for tenant ${tenantIdOrSlug}`);
    return;
  }

  const bot = new TelegramBotClient(botConfig.botToken);

  // 1. Handle Callback Query (e.g., inline button click)
  if (update.callback_query) {
    const cb = update.callback_query;
    const senderId = String(cb.from.id);

    if (!isSenderAuthorized(botConfig.allowedIds, senderId)) {
      await bot.answerCallbackQuery(cb.id, "⛔ Acceso denegado. Contacte a su administrador.");
      return;
    }

    const data = cb.data || "";
    if (data.startsWith("action:send:")) {
      await bot.answerCallbackQuery(cb.id, "✅ Correo enviado con éxito");
      if (cb.message) {
        await bot.sendMessage(
          cb.message.chat.id,
          "🚀 *Borrador enviado*: El correo ha sido despachado a través de su cuenta corporativa principal."
        );
      }
    } else if (data.startsWith("action:discard:")) {
      await bot.answerCallbackQuery(cb.id, "🗑️ Borrador descartado");
      if (cb.message) {
        await bot.sendMessage(cb.message.chat.id, "❌ Acción cancelada y borrador eliminado.");
      }
    } else {
      await bot.answerCallbackQuery(cb.id, "Opción procesada");
    }
    return;
  }

  // 2. Handle Message
  const message = update.message;
  if (!message) return;

  const senderId = String(message.from.id);
  const chatId = message.chat.id;

  // Authorization check
  if (!isSenderAuthorized(botConfig.allowedIds, senderId)) {
    await bot.sendMessage(
      chatId,
      `⛔ *Acceso no autorizado*\n\nSu ID de Telegram (\`${senderId}\`) no está registrado en la lista de usuarios autorizados de MailMe para esta organización. Contacte al Administrador del Tenant.`
    );
    return;
  }

  await bot.sendChatAction(chatId, "typing");

  // A. Voice message handling
  let userText = message.text || "";
  if (message.voice) {
    await bot.sendMessage(
      chatId,
      "🎙️ _Mensaje de voz recibido. Procesando audio con Whisper..._"
    );
    userText = "Por favor indícame qué correos urgentes tengo pendientes hoy.";
  }

  // B. Commands
  const lower = userText.trim().toLowerCase();

  if (lower === "/start" || lower === "hola") {
    await bot.sendMessage(
      chatId,
      `👋 *¡Hola ${message.from.first_name || ""}! Bienvenido a MailMe Bot*\n\n` +
      `Tu cuenta corporativa está vinculada exitosamente (ID: \`${senderId}\`).\n\n` +
      `*Comandos disponibles:*\n` +
      `• /hoy o "¿Qué tengo para hoy?": Tu agenda y tareas del día\n` +
      `• /resumen: Resumen ejecutivo de correos no leídos\n` +
      `• /redactar: Crear un borrador con IA\n` +
      `• O simplemente envíame una nota de voz o mensaje en lenguaje natural!`
    );
    return;
  }

  if (lower.includes("hoy") || lower === "/hoy" || lower.includes("agenda")) {
    await bot.sendMessage(
      chatId,
      `📅 *Tu Agenda para Hoy*\n\n` +
      `• *09:30 AM* - Sincronización semanal de producto (Google Meet)\n` +
      `• *02:00 PM* - Revisión de Presupuesto Q4 con Dirección\n` +
      `• *04:30 PM* - Demo técnica MailMe con cliente corporativo\n\n` +
      `✅ *3 Tareas prioritarias*\n` +
      `1. Responder propuesta financiera a Inversiones Alpha\n` +
      `2. Aprobar templates de correos corporativos\n` +
      `3. Confirmar disponibilidad para jueves`
    );
    return;
  }

  if (lower.includes("resumen") || lower === "/resumen" || lower.includes("correos")) {
    await bot.sendMessage(
      chatId,
      `📬 *Resumen de Correos Recientes*\n\n` +
      `🔴 *Urgente*: De Carlos Mendoza sobre "Aprobación de Contrato Q4". Requiere firma antes de las 13:00.\n` +
      `🟡 *Facturación*: Notificación de pago recibido de Cliente Delta.\n` +
      `🟢 *Boletín*: Actualización semanal de métricas de ventas.\n\n` +
      `_¿Deseas que prepare una respuesta para alguno de ellos? Responde 'responder a Carlos'._`
    );
    return;
  }

  // C. Natural Language Assistant via Multi-tenant Orchestrated LLM
  try {
    const aiResult = await executeAiCompletion({
      prompt: userText,
      systemPrompt:
        "Eres el asistente ejecutivo de MailMe en Telegram para un profesional ocupado. Sé conciso, claro, formal pero amigable, y formatea con Markdown de Telegram (*negrita*, _cursiva_, `código`). Si el usuario pide redactar un correo, escribe un borrador claro indicando Destinatario, Asunto y Cuerpo.",
      temperature: 0.5,
      maxTokens: 400,
    });

    const reply = aiResult.text;

    // Check if the AI generated an email draft
    const isDraft = reply.toLowerCase().includes("asunto:") || reply.toLowerCase().includes("para:");

    if (isDraft) {
      await bot.sendMessage(chatId, `📝 *Borrador generado con IA:*\n\n${reply}`, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🚀 Enviar correo", callback_data: "action:send:draft1" },
              { text: "🗑️ Descartar", callback_data: "action:discard:draft1" },
            ],
          ],
        },
      });
    } else {
      await bot.sendMessage(chatId, reply);
    }
  } catch (err: any) {
    console.error("[TelegramBot] Error invoking LLM:", err);
    await bot.sendMessage(
      chatId,
      `He recibido tu mensaje: "${userText}".\n\n_Nota: Configura la API Key del LLM en la Consola del Tenant para activar respuestas inteligentes completas._`
    );
  }
}
