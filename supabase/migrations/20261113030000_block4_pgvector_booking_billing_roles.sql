-- ==============================================================================
-- WORVANTA — BLOCK 4: PGVECTOR SEMANTIC SEARCH, BOOKING LINKS, ROLES & BILLING
-- ==============================================================================

-- 1. Enable pgvector extension for Semantic Search across Emails & Chat
CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE public.emails
  ADD COLUMN IF NOT EXISTS embedding vector(768);

ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS embedding vector(768);

-- Semantic similarity search RPC strictly isolated by tenant_id
CREATE OR REPLACE FUNCTION public.match_workspace_semantic(
  query_embedding vector(768),
  p_tenant_id UUID,
  match_threshold FLOAT DEFAULT 0.65,
  match_count INT DEFAULT 8
)
RETURNS TABLE (
  source_type TEXT,
  item_id UUID,
  title TEXT,
  snippet TEXT,
  similarity FLOAT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql STABLE
AS $$
  (
    SELECT
      'email'::TEXT AS source_type,
      e.id AS item_id,
      COALESCE(e.subject, '(Sin asunto)') AS title,
      COALESCE(e.ai_summary, LEFT(e.body_text, 200), '') AS snippet,
      1 - (e.embedding <=> query_embedding) AS similarity,
      e.date AS created_at
    FROM public.emails e
    WHERE e.tenant_id = p_tenant_id
      AND e.embedding IS NOT NULL
      AND 1 - (e.embedding <=> query_embedding) >= match_threshold
  )
  UNION ALL
  (
    SELECT
      'chat'::TEXT AS source_type,
      m.id AS item_id,
      'Mensaje en canal de equipo'::TEXT AS title,
      LEFT(m.content, 200) AS snippet,
      1 - (m.embedding <=> query_embedding) AS similarity,
      m.created_at AS created_at
    FROM public.chat_messages m
    WHERE m.tenant_id = p_tenant_id
      AND m.embedding IS NOT NULL
      AND 1 - (m.embedding <=> query_embedding) >= match_threshold
  )
  ORDER BY similarity DESC
  LIMIT match_count;
$$;

-- 2. Granular Roles (including guest_readonly) & Data Retention / Billing on tenants
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS billing_provider TEXT NOT NULL DEFAULT 'mercadopago'
    CHECK (billing_provider IN ('mercadopago', 'stripe', 'manual')),
  ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'active'
    CHECK (subscription_status IN ('active', 'trialing', 'past_due', 'canceled')),
  ADD COLUMN IF NOT EXISTS retention_days INT NOT NULL DEFAULT 365;

-- 3. Public Calendly-style Booking Links & Guest Bookings
CREATE TABLE IF NOT EXISTS public.booking_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  host_name TEXT NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.booking_links ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'booking_links' AND policyname = 'Tenant members manage booking links'
  ) THEN
    CREATE POLICY "Tenant members manage booking links" ON public.booking_links
      FOR ALL USING (
        tenant_id IN (
          SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
        )
      )
      WITH CHECK (
        tenant_id IN (
          SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  booking_link_id UUID REFERENCES public.booking_links(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  slot_label TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('confirmed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'bookings' AND policyname = 'Tenant members view bookings'
  ) THEN
    CREATE POLICY "Tenant members view bookings" ON public.bookings
      FOR ALL USING (
        tenant_id IN (
          SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
        )
      )
      WITH CHECK (
        tenant_id IN (
          SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
        )
      );
  END IF;
END $$;
