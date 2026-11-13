-- ==============================================================================
-- WORVANTA — BLOCK 2: SNOOZE, FOLLOW-UP, SCHEDULED SEND, TEMPLATES & CLOSED RULES
-- ==============================================================================

-- 1. Columns on emails for Snooze, Follow-Up Reminders, and Scheduled Send
ALTER TABLE public.emails
  ADD COLUMN IF NOT EXISTS snoozed_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS follow_up_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS follow_up_status TEXT NOT NULL DEFAULT 'none'
    CHECK (follow_up_status IN ('none', 'waiting_reply', 'triggered', 'completed')),
  ADD COLUMN IF NOT EXISTS scheduled_send_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_emails_snoozed_until ON public.emails(tenant_id, snoozed_until)
  WHERE snoozed_until IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_emails_follow_up ON public.emails(tenant_id, follow_up_status, follow_up_at)
  WHERE follow_up_status = 'waiting_reply';

-- 2. Email Templates (User & Tenant-wide)
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  subject_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  is_tenant_wide BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'email_templates' AND policyname = 'Tenant members can access email templates'
  ) THEN
    CREATE POLICY "Tenant members can access email templates" ON public.email_templates
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

-- 3. Closed-List Email Automation Rules (Strict Enum Checks — No Arbitrary Execution)
CREATE TABLE IF NOT EXISTS public.email_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  condition_field TEXT NOT NULL
    CHECK (condition_field IN ('from', 'to', 'subject', 'has_attachment', 'ai_category')),
  condition_operator TEXT NOT NULL
    CHECK (condition_operator IN ('contains', 'equals', 'ends_with')),
  condition_value TEXT NOT NULL,
  action_type TEXT NOT NULL
    CHECK (action_type IN ('add_tag', 'move_to_folder', 'assign_to_user', 'mark_priority', 'notify_channel')),
  action_value TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_rules ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'email_rules' AND policyname = 'Tenant members can manage email rules'
  ) THEN
    CREATE POLICY "Tenant members can manage email rules" ON public.email_rules
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
