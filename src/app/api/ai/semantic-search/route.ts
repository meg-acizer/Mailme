import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/security/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Generates a 768-dimensional embedding using Gemini text-embedding-004
 * when GEMINI_API_KEY is configured, then queries Supabase pgvector RPC `match_workspace_semantic`.
 */
async function generateGeminiEmbedding(text: string): Promise<number[] | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/text-embedding-004",
        content: { parts: [{ text }] },
      }),
    }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const values = data?.embedding?.values;
  return Array.isArray(values) ? values : null;
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(`ai:semantic:${ip}`, 40, 60_000);
    if (!rl.allowed) return rateLimitResponse(rl.resetAt);

    const body = await request.json();
    const {
      query = "",
      tenantId = "11111111-1111-1111-1111-111111111111",
    } = body as { query?: string; tenantId?: string };

    if (!query.trim()) {
      return NextResponse.json({ matches: [], engine: "empty" });
    }

    const embedding = await generateGeminiEmbedding(query.trim());
    if (embedding) {
      try {
        const supabase = createAdminClient();
        const { data, error } = await supabase.rpc("match_workspace_semantic", {
          query_embedding: embedding,
          p_tenant_id: tenantId,
          match_threshold: 0.6,
          match_count: 6,
        });
        if (!error && Array.isArray(data) && data.length > 0) {
          return NextResponse.json({
            ok: true,
            engine: "pgvector",
            matches: data,
          });
        }
      } catch {
        // Fallback below if pgvector RPC not yet migrated on remote DB
      }
    }

    return NextResponse.json({
      ok: true,
      engine: "hybrid_fallback",
      matches: [],
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error en búsqueda semántica";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
