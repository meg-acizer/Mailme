// Runner de Long Polling para Telegram en Desarrollo Local
// Permite recibir y responder mensajes desde localhost sin necesidad de ngrok o Vercel.

import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import fs from "fs";
import path from "path";

// Leer variables de .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf-8") : "";
const env = {};
envContent.split("\n").forEach((line) => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || "";
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    env[match[1]] = value.trim();
  }
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const MASTER_KEY = env.ENCRYPTION_MASTER_KEY || process.env.ENCRYPTION_MASTER_KEY;

function decryptCredentials(encryptedBase64) {
  if (!MASTER_KEY || MASTER_KEY.length < 32) {
    throw new Error("ENCRYPTION_MASTER_KEY inválido");
  }
  const key = crypto.createHash("sha256").update(MASTER_KEY).digest();
  const buffer = Buffer.from(encryptedBase64, "base64");
  const iv = buffer.subarray(0, 12);
  const tag = buffer.subarray(12, 28);
  const cipherText = buffer.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(cipherText), decipher.final()]).toString("utf8");
}

async function getBotConfig() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data: tenant, error } = await supabase
    .from("tenants")
    .select("id, name, settings")
    .eq("slug", "acme-corp")
    .maybeSingle();

  if (error || !tenant) {
    throw new Error("No se pudo obtener el tenant desde Supabase");
  }

  const tg = tenant.settings?.telegram_bot;
  if (!tg || !tg.bot_token) {
    throw new Error("No hay bot token configurado en la Consola del Tenant en Supabase");
  }

  let botToken = tg.bot_token;
  if (botToken.length > 50) {
    try {
      botToken = decryptCredentials(botToken);
    } catch {
      // Usar tal cual si no estaba cifrado
    }
  }

  const allowedIds = Array.isArray(tg.allowed_ids)
    ? tg.allowed_ids.map((id) => String(id).trim())
    : [];

  return {
    tenantId: tenant.id,
    botToken,
    botUsername: tg.bot_username || "@Bot",
    allowedIds,
  };
}

async function sendTelegramMessage(botToken, chatId, text, replyMarkup) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
        reply_markup: replyMarkup,
      }),
    });
    return await res.json();
  } catch (err) {
    console.error("Error enviando mensaje:", err.message);
  }
}

async function main() {
  console.log("====================================================");
  console.log("  🚀 MailMe - Telegram Dev Polling Runner");
  console.log("====================================================");
  console.log("Obteniendo configuración desde Supabase...");

  let config;
  try {
    config = await getBotConfig();
    console.log(`✓ Bot configurado: ${config.botUsername}`);
    console.log(`✓ Whitelist actual: [ ${config.allowedIds.join(", ")} ]`);
  } catch (err) {
    console.error("❌ Error de configuración:", err.message);
    process.exit(1);
  }

  const { botToken, allowedIds } = config;

  // 1. Verificar credenciales con getMe
  const meRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
  const meData = await meRes.json();
  if (!meData.ok) {
    console.error("❌ Token inválido según Telegram:", meData.description);
    process.exit(1);
  }
  console.log(`🤖 Conectado con éxito a Telegram como: @${meData.result.username} (${meData.result.first_name})`);

  // 2. Eliminar webhook para permitir getUpdates
  console.log("Eliminando webhook previo para habilitar modo Long Polling local...");
  const delRes = await fetch(`https://api.telegram.org/bot${botToken}/deleteWebhook?drop_pending_updates=false`);
  const delData = await delRes.json();
  if (delData.ok) {
    console.log("✓ Webhook removido. Modo Polling local activo y escuchando...");
  } else {
    console.warn("Aviso al remover webhook:", delData.description);
  }

  console.log("\n⚡ ¡Listo! Envía cualquier mensaje a tu bot en Telegram.");
  console.log("----------------------------------------------------");

  let offset = 0;

  while (true) {
    try {
      const res = await fetch(
        `https://api.telegram.org/bot${botToken}/getUpdates?offset=${offset}&timeout=25`
      );
      const data = await res.json();

      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          offset = update.update_id + 1;

          // A. Manejo de botones (Callback Query)
          if (update.callback_query) {
            const cb = update.callback_query;
            const senderId = String(cb.from.id);
            console.log(`\n🔘 [Clic en botón] Usuario: ${cb.from.first_name} (ID: ${senderId}), Acción: ${cb.data}`);
            
            await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ callback_query_id: cb.id, text: "Acción procesada" }),
            });

            if (cb.data?.startsWith("action:send:")) {
              await sendTelegramMessage(botToken, cb.message.chat.id, "🚀 *Correo enviado con éxito* a través de su cuenta corporativa.");
            } else if (cb.data?.startsWith("action:discard:")) {
              await sendTelegramMessage(botToken, cb.message.chat.id, "🗑️ *Borrador descartado*.");
            }
            continue;
          }

          // B. Manejo de Mensajes
          const message = update.message;
          if (!message) continue;

          const senderId = String(message.from.id);
          const senderName = `${message.from.first_name || ""} ${message.from.last_name || ""}`.trim();
          const userHandle = message.from.username ? `@${message.from.username}` : "";
          const text = message.text || (message.voice ? "[Nota de voz]" : "[Archivo/Otro]");

          console.log(`\n📩 [Mensaje recibido]`);
          console.log(`   Remitente: ${senderName} ${userHandle}`);
          console.log(`   Telegram ID: ${senderId}`);
          console.log(`   Contenido: "${text}"`);

          // Comprobación de Whitelist
          const isAllowed =
            allowedIds.length === 0 ||
            allowedIds.some((allowed) => allowed.split(" ")[0].trim() === senderId);

          if (!isAllowed) {
            console.log(`   ⛔ Acceso RECHAZADO: El ID ${senderId} NO está en la Whitelist.`);
            await sendTelegramMessage(
              botToken,
              message.chat.id,
              `⛔ *Acceso no autorizado*\n\nTu ID de Telegram es: \`${senderId}\`\n\nEste ID no está dado de alta en la lista blanca de tu empresa en MailMe.\n\n👉 *Copia este ID:* \`${senderId}\` y agrégalo en la sección *Bot Telegram & Whitelist* del panel de administración para habilitarte.`
            );
            continue;
          }

          console.log(`   ✅ Acceso AUTORIZADO. Procesando respuesta...`);

          const lower = (message.text || "").trim().toLowerCase();

          // Comandos rápidos
          if (lower === "/start" || lower === "hola") {
            await sendTelegramMessage(
              botToken,
              message.chat.id,
              `👋 *¡Hola ${message.from.first_name}! Bienvenido a MailMe Bot*\n\n` +
              `Tu cuenta corporativa está vinculada exitosamente (ID: \`${senderId}\`).\n\n` +
              `*Comandos disponibles:*\n` +
              `• /hoy: Tu agenda y tareas del día\n` +
              `• /resumen: Resumen ejecutivo de correos\n` +
              `• /redactar: Crear un borrador con IA\n` +
              `• O envíame cualquier pregunta o nota de voz!`
            );
          } else if (lower.includes("hoy") || lower === "/hoy" || lower.includes("agenda")) {
            await sendTelegramMessage(
              botToken,
              message.chat.id,
              `📅 *Tu Agenda para Hoy*\n\n` +
              `• *09:30 AM* - Sincronización semanal de producto (Google Meet)\n` +
              `• *02:00 PM* - Revisión de Presupuesto Q4 con Dirección\n` +
              `• *04:30 PM* - Demo técnica MailMe con cliente corporativo\n\n` +
              `✅ *3 Tareas prioritarias*\n` +
              `1. Responder propuesta financiera a Inversiones Alpha\n` +
              `2. Aprobar templates corporativos\n` +
              `3. Confirmar disponibilidad para jueves`
            );
          } else if (lower.includes("resumen") || lower === "/resumen" || lower.includes("correos")) {
            await sendTelegramMessage(
              botToken,
              message.chat.id,
              `📬 *Resumen de Correos Recientes*\n\n` +
              `🔴 *Urgente*: De Carlos Mendoza sobre "Aprobación de Contrato Q4". Requiere firma antes de las 13:00.\n` +
              `🟡 *Facturación*: Notificación de pago recibido de Cliente Delta.\n` +
              `🟢 *Boletín*: Actualización semanal de métricas de ventas.\n\n` +
              `_¿Deseas responder a alguno? Escribe "responder a Carlos" o envía una nota de voz._`
            );
          } else if (message.voice) {
            await sendTelegramMessage(
              botToken,
              message.chat.id,
              `🎙️ *Nota de voz procesada con éxito*\n\n_Intención detectada:_ "Consultar reuniones de la tarde".\n\n• Tienes 2 reuniones programadas a partir de las 14:00.`
            );
          } else {
            // Respuesta asistida con borrador de correo interactivo
            await sendTelegramMessage(
              botToken,
              message.chat.id,
              `📝 *Borrador generado por IA:*\n\n` +
              `*Para:* carlos@empresa.com\n` +
              `*Asunto:* Confirmación y avance de propuesta\n\n` +
              `Hola Carlos,\nHe revisado el documento y los términos financieros están alineados. Procedemos con la firma.\n\nSaludos,\nEquipo MailMe`,
              {
                inline_keyboard: [
                  [
                    { text: "🚀 Enviar correo", callback_data: "action:send:draft1" },
                    { text: "🗑️ Descartar", callback_data: "action:discard:draft1" },
                  ],
                ],
              }
            );
          }
          console.log(`   ✓ Respuesta despachada a Telegram.`);
        }
      }
    } catch (loopErr) {
      // Continuar polling ante desconexiones de red breves
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

main().catch(console.error);
