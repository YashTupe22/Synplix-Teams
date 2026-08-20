import { notFound } from "next/navigation";
import { requirePermission, Permission } from "@/lib/authorization-server";
import { getProjectById, getProjectMembers, getProjectMilestones, getTeamMembers } from "@/services/projects";
import { getTasksByProject, getTaskMetrics } from "@/services/tasks";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { PROJECT_STATUS_CONFIG, PROJECT_PRIORITY_CONFIG } from "@/types/clients";
import { TASK_STATUS_CONFIG } from "@/types/tasks";
import { MilestoneList } from "@/components/projects/milestone-list";
import { MemberList } from "@/components/projects/member-list";
import { createMilestoneAction, updateMilestoneAction, addProjectMemberAction, removeProjectMemberAction } from "../actions";
import { Calendar, User, FolderKanban, CheckCircle, ListTodo, Plus } from "lucide-react";
import Link from "next/link";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProjectById(id);
  return { title: project ? `${project.name} | Projects` : "Project | Synplix Teams" };
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission(Permission.PROJECTS_VIEW);
  const { id } = await params;

  const project = await getProjectById(id);
  if (!project) notFound();

  const [members, milestones, teamMembers, taskResult, taskMetrics] = await Promise.all([
    getProjectMembers(id).catch(() => []),
    getProjectMilestones(id).catch(() => []),
    getTeamMembers(),
    getTasksByProject(id, { limit: 100 }).catch(() => ({ data: [], total: 0 })),
    getTaskMetrics(id).catch(() => ({ total: 0, todo: 0, inProgress: 0, inReview: 0, blocked: 0, completed: 0, cancelled: 0, overdue: 0, dueToday: 0, dueThisWeek: 0 })),
  ]);

  const statusCfg = PROJECT_STATUS_CONFIG[project.status];
  const priorityCfg = PROJECT_PRIORITY_CONFIG[project.priority];

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title={project.name}
        description={project.project_code}
      >
        <div className="flex items-center gap-2">
          <Link
            href={`/projects/${id}/edit`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Edit
          </Link>
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <FolderKanban className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Client</p>
                    <Link href={`/clients/${project.client?.id}`} className="text-sm text-muted-foreground hover:underline">
                      {project.client?.company?.name ?? "—"} ({project.client?.client_code})
                    </Link>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <User className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Project Manager</p>
                    <p className="text-sm text-muted-foreground">
                      {project.project_manager?.full_name ?? "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Timeline</p>
                    <p className="text-sm text-muted-foreground">
                      {project.start_date
                        ? new Date(project.start_date).toLocaleDateString("en-IN")
                        : "Not set"}{" "}
                      –{" "}
                      {project.target_end_date
                        ? new Date(project.target_end_date).toLocaleDateString("en-IN")
                        : "Not set"}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Status & Priority</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={statusCfg.color}>{statusCfg.label}</Badge>
                    <span className={`text-xs ${priorityCfg.color}`}>{priorityCfg.label}</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Progress</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${project.progress_percent}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{project.progress_percent}%</span>
                </div>
              </div>

              {project.description && (
                <div>
                  <p className="text-sm font-medium mb-1">Description</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{project.description}</p>
                </div>
              )}

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Milestones: {project.milestones_completed}/{project.milestones_total} completed</span>
                <span>Members: {project.members_count}</span>
                <span>Tasks: {taskMetrics.total} ({taskMetrics.completed} done)</span>
              </div>
            </CardContent>
          </Card>

          <MilestoneList
            milestones={milestones}
            projectId={id}
            createAction={createMilestoneAction}
            updateAction={updateMilestoneAction}
          />

          {/* Task Overview */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <ListTodo className="size-4" />
                Tasks
                <Badge variant="outline" className="ml-2 text-xs">
                  {taskMetrics.total}
                </Badge>
              </CardTitle>
              <div className="flex items-center gap-2">
                <Link
                  href={`/tasks?project_id=${id}`}
                  className={buttonVariants({ variant: "ghost", size: "sm" })}
                >
                  View All
                </Link>
                <Link
                  href={`/tasks/new?project_id=${id}`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Add Task
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-3 mb-4">
                <div className="text-center">
                  <p className="text-lg font-bold">{taskMetrics.todo}</p>
                  <p className="text-[10px] text-muted-foreground">To Do</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-blue-600">{taskMetrics.inProgress}</p>
                  <p className="text-[10px] text-muted-foreground">In Progress</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-purple-600">{taskMetrics.inReview}</p>
                  <p className="text-[10px] text-muted-foreground">In Review</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-red-600">{taskMetrics.blocked}</p>
                  <p className="text-[10px] text-muted-foreground">Blocked</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-green-600">{taskMetrics.completed}</p>
                  <p className="text-[10px] text-muted-foreground">Completed</p>
                </div>
              </div>

              {taskMetrics.overdue > 0 && (
                <div className="mb-3 rounded-md bg-red-50 p-2 text-xs text-red-700">
                  {taskMetrics.overdue} overdue task{taskMetrics.overdue !== 1 ? "s" : ""}
                </div>
              )}

              {taskResult.data.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No tasks yet. Create the first task for this project.
                </p>
              ) : (
                <div className="space-y-2">
                  {taskResult.data.slice(0, 8).map((task) => (
                    <Link key={task.id} href={`/tasks/${task.id}`}>
                      <div className="flex items-center justify-between rounded-lg border border-border p-2.5 transition-colors hover:bg-muted/50">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${TASK_STATUS_CONFIG[task.status]?.color || ""}`}
                          >
                            {TASK_STATUS_CONFIG[task.status]?.label || task.status}
                          </Badge>
                          <span className="text-sm">{task.title}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {task.assignee && (
                            <span>{task.assignee.full_name || task.assignee.email}</span>
                          )}
                          {task.due_date && (
                            <span>Due {new Date(task.due_date).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <MemberList
            members={members}
            projectId={id}
            teamMembers={teamMembers}
            addAction={addProjectMemberAction}
            removeAction={removeProjectMemberAction}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="size-4" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Project Code</span>
                <span className="font-mono">{project.project_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created by</span>
                <span>{project.created_by_user?.full_name ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{new Date(project.created_at).toLocaleDateString("en-IN")}</span>
              </div>
              {project.completed_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Completed</span>
                  <span>{new Date(project.completed_at).toLocaleDateString("en-IN")}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
