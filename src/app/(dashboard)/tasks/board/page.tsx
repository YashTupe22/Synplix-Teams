import { Metadata } from "next";
import { requirePermission } from "@/lib/authorization-server";
import { Permission } from "@/lib/authorization";
import { getTasks } from "@/services/tasks";
import { PageHeader } from "@/components/page-header";
import { TaskBoard } from "@/components/tasks/task-board";

export const metadata: Metadata = {
  title: "Task Board | Synplix Infotech",
  description: "Kanban board view of all tasks",
};

export default async function TaskBoardPage() {
  await requirePermission(Permission.TASKS_VIEW);

  const result = await getTasks({ limit: 200 });

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Task Board"
        description="Visual kanban view of all tasks"
      />

      <TaskBoard tasks={result.data} />
    </div>
  );
}
