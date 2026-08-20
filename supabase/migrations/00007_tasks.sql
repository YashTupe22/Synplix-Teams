-- Phase 7: Task Management + Team Workspace
-- Creates: tasks, task_comments
-- Reuses: profiles, projects, project_members, project_milestones, audit_logs

-- ============================================================
-- ENUMS
-- ============================================================

DO $$ BEGIN
    CREATE TYPE public.task_status AS ENUM (
        'todo', 'in_progress', 'in_review', 'blocked', 'completed', 'cancelled'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE public.task_priority AS ENUM (
        'low', 'medium', 'high', 'urgent'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- TASKS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    milestone_id UUID REFERENCES public.project_milestones(id) ON DELETE SET NULL,
    title TEXT NOT NULL CHECK (char_length(title) <= 500),
    description TEXT CHECK (char_length(description) <= 5000),
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    status public.task_status NOT NULL DEFAULT 'todo',
    priority public.task_priority NOT NULL DEFAULT 'medium',
    due_date DATE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tasks_project_id_idx ON public.tasks (project_id);
CREATE INDEX IF NOT EXISTS tasks_milestone_id_idx ON public.tasks (milestone_id);
CREATE INDEX IF NOT EXISTS tasks_assigned_to_idx ON public.tasks (assigned_to);
CREATE INDEX IF NOT EXISTS tasks_created_by_idx ON public.tasks (created_by);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON public.tasks (status);
CREATE INDEX IF NOT EXISTS tasks_priority_idx ON public.tasks (priority);
CREATE INDEX IF NOT EXISTS tasks_due_date_idx ON public.tasks (due_date);
CREATE INDEX IF NOT EXISTS tasks_created_at_idx ON public.tasks (created_at DESC);

DROP TRIGGER IF EXISTS set_tasks_updated_at ON public.tasks;
CREATE TRIGGER set_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- TASK COMMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    content TEXT NOT NULL CHECK (char_length(content) <= 2000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS task_comments_task_id_idx ON public.task_comments (task_id);
CREATE INDEX IF NOT EXISTS task_comments_author_id_idx ON public.task_comments (author_id);
CREATE INDEX IF NOT EXISTS task_comments_created_at_idx ON public.task_comments (created_at DESC);

DROP TRIGGER IF EXISTS set_task_comments_updated_at ON public.task_comments;
CREATE TRIGGER set_task_comments_updated_at
    BEFORE UPDATE ON public.task_comments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- RLS: TASKS
-- ============================================================

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY "Admins can manage tasks"
    ON public.tasks
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

-- Manager: can manage tasks
CREATE POLICY "Managers can manage tasks"
    ON public.tasks
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

-- Employee: can view tasks in their projects
CREATE POLICY "Employees can view tasks for their projects"
    ON public.tasks
    FOR SELECT
    TO authenticated
    USING (
        public.get_user_role(auth.uid()) = 'employee'
        AND public.is_user_active(auth.uid())
        AND (
            assigned_to = auth.uid()
            OR created_by = auth.uid()
            OR EXISTS (
                SELECT 1 FROM public.projects p
                WHERE p.id = tasks.project_id
                  AND (
                      p.project_manager_id = auth.uid()
                      OR EXISTS (
                          SELECT 1 FROM public.project_members pm
                          WHERE pm.project_id = p.id AND pm.user_id = auth.uid()
                      )
                  )
            )
        )
    );

-- Employee: can create tasks in their projects
CREATE POLICY "Employees can create tasks in their projects"
    ON public.tasks
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.get_user_role(auth.uid()) = 'employee'
        AND public.is_user_active(auth.uid())
        AND created_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = tasks.project_id
              AND (
                  p.project_manager_id = auth.uid()
                  OR EXISTS (
                      SELECT 1 FROM public.project_members pm
                      WHERE pm.project_id = p.id AND pm.user_id = auth.uid()
                  )
              )
        )
    );

-- Employee: can update tasks assigned to them
CREATE POLICY "Employees can update tasks assigned to them"
    ON public.tasks
    FOR UPDATE
    TO authenticated
    USING (
        public.get_user_role(auth.uid()) = 'employee'
        AND public.is_user_active(auth.uid())
        AND (
            assigned_to = auth.uid()
            OR created_by = auth.uid()
        )
    )
    WITH CHECK (
        public.get_user_role(auth.uid()) = 'employee'
        AND public.is_user_active(auth.uid())
        AND (
            assigned_to = auth.uid()
            OR created_by = auth.uid()
        )
    );

-- ============================================================
-- RLS: TASK COMMENTS
-- ============================================================

ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY "Admins can manage task comments"
    ON public.task_comments
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

-- Manager: can manage task comments
CREATE POLICY "Managers can manage task comments"
    ON public.task_comments
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

-- Employee: can view comments on tasks they can see
CREATE POLICY "Employees can view comments for their tasks"
    ON public.task_comments
    FOR SELECT
    TO authenticated
    USING (
        public.get_user_role(auth.uid()) = 'employee'
        AND public.is_user_active(auth.uid())
        AND EXISTS (
            SELECT 1 FROM public.tasks t
            WHERE t.id = task_comments.task_id
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

-- Employee: can create comments on tasks they can see
CREATE POLICY "Employees can create comments for their tasks"
    ON public.task_comments
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.get_user_role(auth.uid()) = 'employee'
        AND public.is_user_active(auth.uid())
        AND author_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.tasks t
            WHERE t.id = task_comments.task_id
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

-- Employee: can update their own comments
CREATE POLICY "Employees can update their own comments"
    ON public.task_comments
    FOR UPDATE
    TO authenticated
    USING (
        public.get_user_role(auth.uid()) = 'employee'
        AND public.is_user_active(auth.uid())
        AND author_id = auth.uid()
    )
    WITH CHECK (
        public.get_user_role(auth.uid()) = 'employee'
        AND public.is_user_active(auth.uid())
        AND author_id = auth.uid()
    );

-- Employee: can delete their own comments
CREATE POLICY "Employees can delete their own comments"
    ON public.task_comments
    FOR DELETE
    TO authenticated
    USING (
        public.get_user_role(auth.uid()) = 'employee'
        AND public.is_user_active(auth.uid())
        AND author_id = auth.uid()
    );

-- ============================================================
-- VALIDATION: Milestone must belong to same project
-- ============================================================

CREATE OR REPLACE FUNCTION public.validate_task_milestone()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.milestone_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.project_milestones pm
            WHERE pm.id = NEW.milestone_id AND pm.project_id = NEW.project_id
        ) THEN
            RAISE EXCEPTION 'Milestone does not belong to this project';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_task_milestone ON public.tasks;
CREATE TRIGGER validate_task_milestone
    BEFORE INSERT OR UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_task_milestone();

-- ============================================================
-- REVOKE defaults for new tables
-- ============================================================

REVOKE ALL ON public.tasks FROM PUBLIC;
REVOKE ALL ON public.tasks FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;

REVOKE ALL ON public.task_comments FROM PUBLIC;
REVOKE ALL ON public.task_comments FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_comments TO authenticated;

-- Grant usage on enum types
GRANT USAGE ON TYPE public.task_status TO authenticated;
GRANT USAGE ON TYPE public.task_priority TO authenticated;
