-- Phase 10: Documents + File Management System
-- Creates: documents table, storage bucket configuration
-- Reuses: profiles, projects, project_members, tasks, clients, leads, companies,
--         contacts, opportunities, quotations, invoices, expenses, audit_logs

-- ============================================================
-- ENUMS
-- ============================================================

-- No database enums needed; entity_type is TEXT with CHECK constraint
-- to allow flexible extension without migration for new entity types.

-- ============================================================
-- DOCUMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name TEXT NOT NULL CHECK (char_length(file_name) <= 500),
    original_file_name TEXT NOT NULL CHECK (char_length(original_file_name) <= 500),
    storage_path TEXT UNIQUE NOT NULL CHECK (char_length(storage_path) <= 2000),
    mime_type TEXT NOT NULL CHECK (char_length(mime_type) <= 255),
    file_size BIGINT NOT NULL CHECK (file_size > 0 AND file_size <= 26214400),
    bucket_name TEXT NOT NULL DEFAULT 'synplix-documents',
    uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    description TEXT CHECK (char_length(description) <= 2000),
    entity_type TEXT NOT NULL CHECK (char_length(entity_type) <= 50),
    entity_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable trgm extension for search (safe to call multiple times, must be before index)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Indexes
CREATE INDEX IF NOT EXISTS documents_uploaded_by_idx ON public.documents (uploaded_by);
CREATE INDEX IF NOT EXISTS documents_created_at_idx ON public.documents (created_at DESC);
CREATE INDEX IF NOT EXISTS documents_mime_type_idx ON public.documents (mime_type);
CREATE INDEX IF NOT EXISTS documents_entity_idx ON public.documents (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS documents_entity_created_idx ON public.documents (entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS documents_file_name_idx ON public.documents USING gin (file_name gin_trgm_ops);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_documents_updated_at ON public.documents;
CREATE TRIGGER set_documents_updated_at
    BEFORE UPDATE ON public.documents
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- RLS: DOCUMENTS
-- ============================================================

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY "Admins can manage documents"
    ON public.documents
    FOR ALL
    TO authenticated
    USING (
        public.get_user_role(auth.uid()) = 'admin'
        AND public.is_user_active(auth.uid())
    )
    WITH CHECK (
        public.get_user_role(auth.uid()) = 'admin'
        AND public.is_user_active(auth.uid())
    );

-- Manager: can manage documents
CREATE POLICY "Managers can manage documents"
    ON public.documents
    FOR ALL
    TO authenticated
    USING (
        public.get_user_role(auth.uid()) = 'manager'
        AND public.is_user_active(auth.uid())
    )
    WITH CHECK (
        public.get_user_role(auth.uid()) = 'manager'
        AND public.is_user_active(auth.uid())
    );

-- Employee: can view documents they uploaded
CREATE POLICY "Employees can view own uploaded documents"
    ON public.documents
    FOR SELECT
    TO authenticated
    USING (
        public.get_user_role(auth.uid()) = 'employee'
        AND public.is_user_active(auth.uid())
        AND uploaded_by = auth.uid()
    );

-- Employee: can view documents on projects they are members of
CREATE POLICY "Employees can view documents for their projects"
    ON public.documents
    FOR SELECT
    TO authenticated
    USING (
        public.get_user_role(auth.uid()) = 'employee'
        AND public.is_user_active(auth.uid())
        AND entity_type = 'project'
        AND EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = documents.entity_id
              AND (
                  p.project_manager_id = auth.uid()
                  OR EXISTS (
                      SELECT 1 FROM public.project_members pm
                      WHERE pm.project_id = p.id AND pm.user_id = auth.uid()
                  )
              )
        )
    );

-- Employee: can view documents on tasks they are assigned to or created
CREATE POLICY "Employees can view documents for their tasks"
    ON public.documents
    FOR SELECT
    TO authenticated
    USING (
        public.get_user_role(auth.uid()) = 'employee'
        AND public.is_user_active(auth.uid())
        AND entity_type = 'task'
        AND EXISTS (
            SELECT 1 FROM public.tasks t
            WHERE t.id = documents.entity_id
              AND (
                  t.assigned_to = auth.uid()
                  OR t.created_by = auth.uid()
                  OR EXISTS (
                      SELECT 1 FROM public.projects p
                      WHERE p.id = t.project_id
                        AND (
                            p.project_manager_id = auth.uid()
                            OR EXISTS (
                                SELECT 1 FROM public.project_members pm
                                WHERE pm.project_id = p.id AND pm.user_id = auth.uid()
                            )
                        )
                  )
              )
        )
    );

-- Employee: can view documents on clients they have access to (via projects)
CREATE POLICY "Employees can view documents for their clients"
    ON public.documents
    FOR SELECT
    TO authenticated
    USING (
        public.get_user_role(auth.uid()) = 'employee'
        AND public.is_user_active(auth.uid())
        AND entity_type = 'client'
        AND EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.client_id = documents.entity_id
              AND (
                  p.project_manager_id = auth.uid()
                  OR EXISTS (
                      SELECT 1 FROM public.project_members pm
                      WHERE pm.project_id = p.id AND pm.user_id = auth.uid()
                  )
              )
        )
    );

-- Employee: can view documents on leads they own
CREATE POLICY "Employees can view documents for their leads"
    ON public.documents
    FOR SELECT
    TO authenticated
    USING (
        public.get_user_role(auth.uid()) = 'employee'
        AND public.is_user_active(auth.uid())
        AND entity_type = 'lead'
        AND EXISTS (
            SELECT 1 FROM public.leads l
            WHERE l.id = documents.entity_id
              AND l.assigned_to = auth.uid()
        )
    );

-- Employee: can view documents on opportunities they own
CREATE POLICY "Employees can view documents for their opportunities"
    ON public.documents
    FOR SELECT
    TO authenticated
    USING (
        public.get_user_role(auth.uid()) = 'employee'
        AND public.is_user_active(auth.uid())
        AND entity_type = 'opportunity'
        AND EXISTS (
            SELECT 1 FROM public.sales_opportunities o
            WHERE o.id = documents.entity_id
              AND o.owner_id = auth.uid()
        )
    );

-- Employee: can view documents on companies they have leads for
CREATE POLICY "Employees can view documents for their companies"
    ON public.documents
    FOR SELECT
    TO authenticated
    USING (
        public.get_user_role(auth.uid()) = 'employee'
        AND public.is_user_active(auth.uid())
        AND entity_type = 'company'
        AND EXISTS (
            SELECT 1 FROM public.leads l
            WHERE l.company_id = documents.entity_id
              AND l.assigned_to = auth.uid()
        )
    );

-- Employee: can view documents on contacts linked to their leads
CREATE POLICY "Employees can view documents for their contacts"
    ON public.documents
    FOR SELECT
    TO authenticated
    USING (
        public.get_user_role(auth.uid()) = 'employee'
        AND public.is_user_active(auth.uid())
        AND entity_type = 'contact'
        AND EXISTS (
            SELECT 1 FROM public.leads l
            WHERE l.contact_id = documents.entity_id
              AND l.assigned_to = auth.uid()
        )
    );

-- Employee: can view documents on quotations for their projects/clients
CREATE POLICY "Employees can view documents for their quotations"
    ON public.documents
    FOR SELECT
    TO authenticated
    USING (
        public.get_user_role(auth.uid()) = 'employee'
        AND public.is_user_active(auth.uid())
        AND entity_type = 'quotation'
        AND EXISTS (
            SELECT 1 FROM public.quotations q
            WHERE q.id = documents.entity_id
              AND q.created_by = auth.uid()
        )
    );

-- Employee: can view documents on invoices for their projects/clients
CREATE POLICY "Employees can view documents for their invoices"
    ON public.documents
    FOR SELECT
    TO authenticated
    USING (
        public.get_user_role(auth.uid()) = 'employee'
        AND public.is_user_active(auth.uid())
        AND entity_type = 'invoice'
        AND EXISTS (
            SELECT 1 FROM public.invoices i
            WHERE i.id = documents.entity_id
              AND i.created_by = auth.uid()
        )
    );

-- Employee: can view documents on expenses they recorded
CREATE POLICY "Employees can view documents for their expenses"
    ON public.documents
    FOR SELECT
    TO authenticated
    USING (
        public.get_user_role(auth.uid()) = 'employee'
        AND public.is_user_active(auth.uid())
        AND entity_type = 'expense'
        AND EXISTS (
            SELECT 1 FROM public.expenses e
            WHERE e.id = documents.entity_id
              AND e.created_by = auth.uid()
        )
    );

-- Employee: can insert documents on projects they are members of
CREATE POLICY "Employees can insert documents for their projects"
    ON public.documents
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.get_user_role(auth.uid()) = 'employee'
        AND public.is_user_active(auth.uid())
        AND uploaded_by = auth.uid()
        AND entity_type = 'project'
        AND EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = documents.entity_id
              AND (
                  p.project_manager_id = auth.uid()
                  OR EXISTS (
                      SELECT 1 FROM public.project_members pm
                      WHERE pm.project_id = p.id AND pm.user_id = auth.uid()
                  )
              )
        )
    );

-- Employee: can insert documents on tasks they are assigned to or created
CREATE POLICY "Employees can insert documents for their tasks"
    ON public.documents
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.get_user_role(auth.uid()) = 'employee'
        AND public.is_user_active(auth.uid())
        AND uploaded_by = auth.uid()
        AND entity_type = 'task'
        AND EXISTS (
            SELECT 1 FROM public.tasks t
            WHERE t.id = documents.entity_id
              AND (
                  t.assigned_to = auth.uid()
                  OR t.created_by = auth.uid()
                  OR EXISTS (
                      SELECT 1 FROM public.projects p
                      WHERE p.id = t.project_id
                        AND (
                            p.project_manager_id = auth.uid()
                            OR EXISTS (
                                SELECT 1 FROM public.project_members pm
                                WHERE pm.project_id = p.id AND pm.user_id = auth.uid()
                            )
                        )
                  )
              )
        )
    );

-- Employee: can insert documents on leads they own
CREATE POLICY "Employees can insert documents for their leads"
    ON public.documents
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.get_user_role(auth.uid()) = 'employee'
        AND public.is_user_active(auth.uid())
        AND uploaded_by = auth.uid()
        AND entity_type = 'lead'
        AND EXISTS (
            SELECT 1 FROM public.leads l
            WHERE l.id = documents.entity_id
              AND l.assigned_to = auth.uid()
        )
    );

-- Employee: can insert documents on opportunities they own
CREATE POLICY "Employees can insert documents for their opportunities"
    ON public.documents
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.get_user_role(auth.uid()) = 'employee'
        AND public.is_user_active(auth.uid())
        AND uploaded_by = auth.uid()
        AND entity_type = 'opportunity'
        AND EXISTS (
            SELECT 1 FROM public.sales_opportunities o
            WHERE o.id = documents.entity_id
              AND o.owner_id = auth.uid()
        )
    );

-- Employee: can insert documents on quotations they created
CREATE POLICY "Employees can insert documents for their quotations"
    ON public.documents
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.get_user_role(auth.uid()) = 'employee'
        AND public.is_user_active(auth.uid())
        AND uploaded_by = auth.uid()
        AND entity_type = 'quotation'
        AND EXISTS (
            SELECT 1 FROM public.quotations q
            WHERE q.id = documents.entity_id
              AND q.created_by = auth.uid()
        )
    );

-- Employee: can insert documents on invoices they created
CREATE POLICY "Employees can insert documents for their invoices"
    ON public.documents
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.get_user_role(auth.uid()) = 'employee'
        AND public.is_user_active(auth.uid())
        AND uploaded_by = auth.uid()
        AND entity_type = 'invoice'
        AND EXISTS (
            SELECT 1 FROM public.invoices i
            WHERE i.id = documents.entity_id
              AND i.created_by = auth.uid()
        )
    );

-- Employee: can insert documents on expenses they recorded
CREATE POLICY "Employees can insert documents for their expenses"
    ON public.documents
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.get_user_role(auth.uid()) = 'employee'
        AND public.is_user_active(auth.uid())
        AND uploaded_by = auth.uid()
        AND entity_type = 'expense'
        AND EXISTS (
            SELECT 1 FROM public.expenses e
            WHERE e.id = documents.entity_id
              AND e.created_by = auth.uid()
        )
    );

-- Employee: can update their own uploaded documents
CREATE POLICY "Employees can update own uploaded documents"
    ON public.documents
    FOR UPDATE
    TO authenticated
    USING (
        public.get_user_role(auth.uid()) = 'employee'
        AND public.is_user_active(auth.uid())
        AND uploaded_by = auth.uid()
    )
    WITH CHECK (
        public.get_user_role(auth.uid()) = 'employee'
        AND public.is_user_active(auth.uid())
        AND uploaded_by = auth.uid()
    );

-- Employee: can delete their own uploaded documents
CREATE POLICY "Employees can delete own uploaded documents"
    ON public.documents
    FOR DELETE
    TO authenticated
    USING (
        public.get_user_role(auth.uid()) = 'employee'
        AND public.is_user_active(auth.uid())
        AND uploaded_by = auth.uid()
    );

-- ============================================================
-- REVOKE defaults
-- ============================================================

REVOKE ALL ON public.documents FROM PUBLIC;
REVOKE ALL ON public.documents FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
