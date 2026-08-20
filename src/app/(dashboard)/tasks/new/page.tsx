import { Metadata } from "next";
import { requirePermission } from "@/lib/authorization-server";
import { Permission } from "@/lib/authorization";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { TaskForm } from "@/components/tasks/task-form";

export const metadata: Metadata = {
  title: "New Task | Synplix Infotech",
  description: "Create a new task",
};

export default async function NewTaskPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  await requirePermission(Permission.TASKS_MANAGE);

  const params = await searchParams;
  const defaultProjectId = params.project_id;
  const defaultMilestoneId = params.milestone_id;

  const supabase = await createClient();

  const [{ data: projects }, { data: milestones }, { data: teamMembers }] =
    await Promise.all([
      supabase
        .from("projects")
        .select("id, name, project_code")
        .order("name"),
      supabase
        .from("project_milestones")
        .select("id, name, project_id")
        .order("name"),
      supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("is_active", true)
        .order("full_name"),
    ]);

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="New Task"
        description="Create a new task"
      />

      <div className="max-w-2xl">
        <TaskForm
          projects={projects || []}
          milestones={milestones || []}
          teamMembers={teamMembers || []}
          defaultProjectId={defaultProjectId}
          defaultMilestoneId={defaultMilestoneId}
        />
      </div>
    </div>
  );
}
