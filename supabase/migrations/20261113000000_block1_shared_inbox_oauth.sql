-- ==============================================================================
-- WORVANTA — BLOCK 1: SHARED INBOX ASSIGNMENT, INTERNAL NOTES, OAUTH & RLS FIX
-- ==============================================================================

-- 1. Fix missing RLS on chat_channel_members
ALTER TABLE public.chat_channel_members ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'chat_channel_members' AND policyname = 'Users can view channel members in their tenant'
  ) THEN
    CREATE POLICY "Users can view channel members in their tenant" ON public.chat_channel_members
      FOR SELECT USING (
        channel_id IN (
          SELECT id FROM public.chat_channels
          WHERE tenant_id IN (
            SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
          )
        )
      );
  END IF;
END $$;

-- 2. Shared Inbox columns on accounts & emails
ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS is_shared BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS shared_team_label TEXT;

ALTER TABLE public.emails
  ADD COLUMN IF NOT EXISTS is_shared_inbox BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ticket_status TEXT NOT NULL DEFAULT 'open'
    CHECK (ticket_status IN ('open', 'in_progress', 'resolved')),
  ADD COLUMN IF NOT EXISTS assigned_to_name TEXT,
  ADD COLUMN IF NOT EXISTS assigned_to_email TEXT,
  ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_emails_ticket_status ON public.emails(tenant_id, ticket_status);
CREATE INDEX IF NOT EXISTS idx_emails_assigned_to ON public.emails(tenant_id, assigned_to_email);

-- 3. Internal Team Notes inside email threads (private to tenant members)
CREATE TABLE IF NOT EXISTS public.email_internal_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  email_id TEXT NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  content TEXT NOT NULL,
  mentions TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_internal_notes_email ON public.email_internal_notes(tenant_id, email_id);

ALTER TABLE public.email_internal_notes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'email_internal_notes' AND policyname = 'Tenant members can manage internal email notes'
  ) THEN
    CREATE POLICY "Tenant members can manage internal email notes" ON public.email_internal_notes
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
