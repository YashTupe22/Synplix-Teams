import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/authorization-server";
import { Permission } from "@/lib/authorization";
import { getTaskById, getTaskComments } from "@/services/tasks";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TaskComments } from "@/components/tasks/task-comments";
import {
  TASK_STATUS_CONFIG,
  TASK_PRIORITY_CONFIG,
} from "@/types/tasks";
import { format } from "date-fns";
import {
  Pencil,
  User,
  FolderKanban,
  Flag,
  CheckCircle,
} from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const task = await getTaskById(id);
  return {
    title: task ? `${task.title} | Tasks` : "Task Not Found",
    description: task?.description || "Task details",
  };
}

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requirePermission(Permission.TASKS_VIEW);
  const { id } = await params;

  const task = await getTaskById(id);
  if (!task) notFound();

  const comments = await getTaskComments(id);

  const today = new Date().toISOString().split("T")[0];
  const isOverdue =
    task.due_date &&
    task.due_date < today &&
    task.status !== "completed" &&
    task.status !== "cancelled";

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title={task.title}
        description={task.description || `Task in ${task.project?.name}`}
      >
        <Link href={`/tasks/${id}/edit`}>
          <Button variant="outline">
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </Link>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {task.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">
                  {task.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Comments */}
          <Card>
            <CardContent className="pt-6">
              <TaskComments
                comments={comments}
                taskId={id}
                currentUserId={profile.id}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Priority */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge
                  variant="outline"
                  className={TASK_STATUS_CONFIG[task.status].color}
                >
                  {TASK_STATUS_CONFIG[task.status].label}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Priority</span>
                <Badge
                  variant="outline"
                  className={TASK_PRIORITY_CONFIG[task.priority].color}
                >
                  <Flag className="mr-1 h-3 w-3" />
                  {TASK_PRIORITY_CONFIG[task.priority].label}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Due Date</span>
                <span
                  className={`text-sm ${isOverdue ? "text-red-600 font-medium" : ""}`}
                >
                  {task.due_date
                    ? format(new Date(task.due_date), "MMM d, yyyy")
                    : "No due date"}
                  {isOverdue && " (Overdue)"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm">
                  {format(new Date(task.created_at), "MMM d, yyyy")}
                </span>
              </div>

              {task.completed_at && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Completed
                  </span>
                  <span className="text-sm text-green-600">
                    {format(new Date(task.completed_at), "MMM d, yyyy")}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Project & Milestone */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Project</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {task.project && (
                <Link
                  href={`/projects/${task.project.id}`}
                  className="flex items-center gap-2 text-sm hover:underline"
                >
                  <FolderKanban className="h-4 w-4" />
                  {task.project.project_code} - {task.project.name}
                </Link>
              )}

              {task.milestone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4" />
                  {task.milestone.name}
                </div>
              )}
            </CardContent>
          </Card>

          {/* People */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">People</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Assignee</p>
                  <p className="text-sm">
                    {task.assignee?.full_name || task.assignee?.email || "Unassigned"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Created by</p>
                  <p className="text-sm">
                    {task.creator?.full_name || task.creator?.email}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
