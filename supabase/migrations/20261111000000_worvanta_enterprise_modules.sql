-- ==============================================================================
-- Worvanta Enterprise Schema Extension
-- Adds: Document Vault (Folders & Files with Readonly/Personal Scopes),
-- Corporate Meeting Rooms, Extended Contacts/Tasks, Audit Logs, and Preferences
-- ==============================================================================

-- 1. DOCUMENT FOLDERS (Personal & Company Shared)
CREATE TABLE IF NOT EXISTS public.document_folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    owner_email TEXT NOT NULL,
    name TEXT NOT NULL,
    scope TEXT NOT NULL DEFAULT 'shared' CHECK (scope IN ('personal', 'shared')),
    color TEXT NOT NULL DEFAULT '#3b82f6',
    files_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. DOCUMENTS / FILES LIBRARY (Default permission: 'readonly')
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES public.document_folders(id) ON DELETE SET NULL,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    owner_name TEXT NOT NULL DEFAULT '',
    owner_email TEXT NOT NULL,
    name TEXT NOT NULL,
    mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
    file_type TEXT NOT NULL DEFAULT 'other' CHECK (file_type IN ('pdf', 'spreadsheet', 'doc', 'image', 'zip', 'other')),
    size_bytes BIGINT NOT NULL DEFAULT 0,
    size_formatted TEXT NOT NULL DEFAULT '0 KB',
    storage_path TEXT,
    scope TEXT NOT NULL DEFAULT 'shared' CHECK (scope IN ('personal', 'shared')),
    permission TEXT NOT NULL DEFAULT 'readonly' CHECK (permission IN ('readonly', 'edit', 'admin')),
    linked_email_id UUID REFERENCES public.emails(id) ON DELETE SET NULL,
    linked_email_subject TEXT,
    scan_status TEXT NOT NULL DEFAULT 'clean' CHECK (scan_status IN ('clean', 'scanning', 'warning', 'infected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_tenant_scope ON public.documents (tenant_id, scope);
CREATE INDEX IF NOT EXISTS idx_documents_owner ON public.documents (owner_email);

-- 3. CORPORATE MEETING ROOMS & RESOURCES
CREATE TABLE IF NOT EXISTS public.corporate_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 8,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    color TEXT NOT NULL DEFAULT '#3b82f6',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Extend events table for scopes & room reservations
ALTER TABLE public.events
    ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT 'company' CHECK (scope IN ('company', 'personal')),
    ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES public.corporate_rooms(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS room_name TEXT,
    ADD COLUMN IF NOT EXISTS organizer_name TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS organizer_email TEXT NOT NULL DEFAULT '';

-- 4. EXTEND CONTACTS FOR SHARED COMPANY DIRECTORY vs PERSONAL VAULT
ALTER TABLE public.contacts
    ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT 'shared' CHECK (scope IN ('shared', 'personal')),
    ADD COLUMN IF NOT EXISTS role TEXT,
    ADD COLUMN IF NOT EXISTS is_internal BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS starred BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS owner_email TEXT;

-- 5. EXTEND TASKS FOR AI COMMITMENTS & KANBAN WORKFLOW
ALTER TABLE public.tasks
    DROP CONSTRAINT IF EXISTS tasks_status_check;

ALTER TABLE public.tasks
    ADD CONSTRAINT tasks_status_check CHECK (status IN ('todo', 'in_progress', 'review', 'done'));

ALTER TABLE public.tasks
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS ai_extracted BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS linked_email_subject TEXT;

-- 6. PRIVACY-SAFE AI & SECURITY AUDIT LOGS (GDPR / SOC2 Compliant)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    action TEXT NOT NULL,
    model TEXT NOT NULL DEFAULT 'gemini-1.5-flash',
    provider TEXT NOT NULL DEFAULT 'gemini',
    tokens_used INTEGER NOT NULL DEFAULT 0,
    cost_usd NUMERIC(12, 6) NOT NULL DEFAULT 0,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs (created_at DESC);

-- 7. USER WORKSPACE PREFERENCES (Column widths, sidebar state, active folders)
CREATE TABLE IF NOT EXISTS public.user_preferences (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    sidebar_collapsed BOOLEAN NOT NULL DEFAULT FALSE,
    col2_width INTEGER NOT NULL DEFAULT 330,
    col4_width INTEGER NOT NULL DEFAULT 300,
    col2_open BOOLEAN NOT NULL DEFAULT TRUE,
    col3_open BOOLEAN NOT NULL DEFAULT TRUE,
    col4_open BOOLEAN NOT NULL DEFAULT TRUE,
    default_tasks_view TEXT NOT NULL DEFAULT 'kanban',
    default_files_view TEXT NOT NULL DEFAULT 'grid',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. ROW LEVEL SECURITY (RLS) FOR PERSONAL vs SHARED SCOPES
ALTER TABLE public.document_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Documents: Shared files visible to tenant; Personal files strictly visible ONLY to owner
CREATE POLICY "Documents visibility by scope" ON public.documents
    FOR SELECT USING (
        tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
        AND (
            scope = 'shared'
            OR owner_id = auth.uid()
            OR owner_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
        )
    );

-- Contacts: Shared directory visible to tenant; Personal contacts strictly visible ONLY to owner
CREATE POLICY "Contacts visibility by scope" ON public.contacts
    FOR SELECT USING (
        tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
        AND (
            scope = 'shared'
            OR user_id = auth.uid()
            OR owner_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
        )
    );

-- User Preferences: Only the owner can read/write their layout settings
CREATE POLICY "Users manage own preferences" ON public.user_preferences
    FOR ALL USING (user_id = auth.uid());
