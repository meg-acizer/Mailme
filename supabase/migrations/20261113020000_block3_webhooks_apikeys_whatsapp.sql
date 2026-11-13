-- ==============================================================================
-- WORVANTA — BLOCK 3: SIGNED OUTBOUND WEBHOOKS, HASHED API KEYS & WHATSAPP BYOA
-- ==============================================================================

-- 1. Hashed Tenant API Keys (Raw key is shown once and never stored)
CREATE TABLE IF NOT EXISTS public.tenant_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  rate_limit_per_min INT NOT NULL DEFAULT 60,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenant_api_keys_tenant ON public.tenant_api_keys(tenant_id);

ALTER TABLE public.tenant_api_keys ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'tenant_api_keys' AND policyname = 'Tenant admins can manage api keys'
  ) THEN
    CREATE POLICY "Tenant admins can manage api keys" ON public.tenant_api_keys
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

-- 2. Outbound Tenant Webhooks (Signed with HMAC-SHA256 & SSRF-guarded)
CREATE TABLE IF NOT EXISTS public.tenant_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_url TEXT NOT NULL,
  signing_secret_encrypted TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenant_webhooks_tenant ON public.tenant_webhooks(tenant_id);

ALTER TABLE public.tenant_webhooks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'tenant_webhooks' AND policyname = 'Tenant admins can manage webhooks'
  ) THEN
    CREATE POLICY "Tenant admins can manage webhooks" ON public.tenant_webhooks
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

-- 3. Webhook Delivery & Exponential Backoff Retry Log
CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  webhook_id UUID REFERENCES public.tenant_webhooks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'delivered', 'failed')),
  attempt_count INT NOT NULL DEFAULT 1,
  http_status INT,
  error_message TEXT,
  next_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_tenant ON public.webhook_deliveries(tenant_id, created_at DESC);

ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'webhook_deliveries' AND policyname = 'Tenant admins can view webhook deliveries'
  ) THEN
    CREATE POLICY "Tenant admins can view webhook deliveries" ON public.webhook_deliveries
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
