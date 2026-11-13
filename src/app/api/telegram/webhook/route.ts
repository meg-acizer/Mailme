import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { processTelegramUpdate, TelegramUpdate } from "@/lib/telegram/bot";

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function POST(req: NextRequest) {
  try {
    const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (expectedSecret) {
      const incomingSecret = req.headers.get("x-telegram-bot-api-secret-token") || "";
      if (!incomingSecret || !safeCompare(incomingSecret, expectedSecret)) {
        return NextResponse.json({ error: "Unauthorized webhook token" }, { status: 401 });
      }
    } else if (process.env.NODE_ENV === "production") {
      console.error("[TelegramWebhook] TELEGRAM_WEBHOOK_SECRET is not configured in production.");
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("tenantId") || "11111111-1111-1111-1111-111111111111";

    const update: TelegramUpdate = await req.json();

    // Process update in background or directly
    // Telegram expects a prompt 200 OK
    processTelegramUpdate(tenantId, update).catch((err) => {
      console.error("[TelegramWebhook] Background error processing update:", err);
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("[TelegramWebhook] Error handling webhook:", error);
    return NextResponse.json({ error: error.message || "Invalid update" }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: "Telegram Webhook Active",
    endpoint: "/api/telegram/webhook?tenantId=<tenant_id>",
    instructions: "Configure this webhook URL in Telegram with setWebhook.",
  });
}
