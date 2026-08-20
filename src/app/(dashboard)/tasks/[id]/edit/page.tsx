import { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/authorization-server";
import { Permission } from "@/lib/authorization";
import { getTaskById } from "@/services/tasks";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { TaskForm } from "@/components/tasks/task-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const task = await getTaskById(id);
  return {
    title: task ? `Edit ${task.title} | Tasks` : "Task Not Found",
    description: "Edit task details",
  };
}

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(Permission.TASKS_MANAGE);
  const { id } = await params;

  const task = await getTaskById(id);
  if (!task) notFound();

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
        title="Edit Task"
        description={`Editing: ${task.title}`}
      />

      <div className="max-w-2xl">
        <TaskForm
          task={task}
          projects={projects || []}
          milestones={milestones || []}
          teamMembers={teamMembers || []}
        />
      </div>
    </div>
  );
}
