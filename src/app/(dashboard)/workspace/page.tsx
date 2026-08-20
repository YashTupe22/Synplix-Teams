import { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/lib/authorization-server";
import { Permission } from "@/lib/authorization";
import { getTasks, getTaskMetrics } from "@/services/tasks";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  ListTodo,
  Clock,
  AlertTriangle,
  CheckCircle,
  Calendar,
  FolderKanban,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Workspace | Synplix Infotech",
  description: "Your team workspace",
};

export default async function WorkspacePage() {
  const profile = await requirePermission(Permission.TASKS_VIEW);

  const supabase = await createClient();

  // Get user's projects
  const { data: projects } = await supabase
    .from("projects")
    .select(
      `
      id, name, project_code, status, progress_percent, target_end_date,
      client:clients!projects_client_id_fkey(id, company:companies(id, name))
    `
    )
    .or(
      `project_manager_id.eq.${profile.id},id.in.(select project_id from project_members where user_id = '${profile.id}')`
    )
    .order("name");

  const [myTasks, metrics] = await Promise.all([
    getTasks({ assigned_to: profile.id, limit: 10 }),
    getTaskMetrics(undefined, profile.id),
  ]);

  const today = new Date().toISOString().split("T")[0];

  // Get overdue tasks
  const overdueResult = await getTasks({
    assigned_to: profile.id,
    overdue: true,
    limit: 5,
  });

  const todayTasks = myTasks.data.filter(
    (t) =>
      t.due_date === today &&
      t.status !== "completed" &&
      t.status !== "cancelled"
  );

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Workspace"
        description={`Welcome back, ${profile.full_name || profile.email}`}
      >
        <Link href="/tasks/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
        </Link>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - My Work */}
        <div className="lg:col-span-2 space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{todayTasks.length}</p>
                    <p className="text-xs text-muted-foreground">Due Today</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-2xl font-bold">{metrics.overdue}</p>
                    <p className="text-xs text-muted-foreground">Overdue</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-2xl font-bold">{metrics.inProgress}</p>
                    <p className="text-xs text-muted-foreground">In Progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{metrics.completed}</p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* My Tasks */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">My Tasks</CardTitle>
              <Link href="/tasks/my">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {myTasks.data.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No tasks assigned to you.
                </p>
              ) : (
                <div className="space-y-2">
                  {myTasks.data.slice(0, 8).map((task) => (
                    <Link key={task.id} href={`/tasks/${task.id}`}>
                      <div className="flex items-center justify-between rounded-lg border border-border p-2.5 transition-colors hover:bg-muted/50">
                        <div>
                          <h3 className="text-sm font-medium">{task.title}</h3>
                          <span className="text-xs text-muted-foreground">
                            {task.project?.project_code}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">
                            {task.status.replace("_", " ")}
                          </Badge>
                          {task.due_date && (
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Overdue Work */}
          {overdueResult.data.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-red-600">
                  Overdue Work
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {overdueResult.data.map((task) => (
                    <Link key={task.id} href={`/tasks/${task.id}`}>
                      <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-2.5 transition-colors hover:bg-red-100">
                        <div>
                          <h3 className="text-sm font-medium">{task.title}</h3>
                          <span className="text-xs text-muted-foreground">
                            {task.project?.project_code} - Due{" "}
                            {new Date(task.due_date!).toLocaleDateString()}
                          </span>
                        </div>
                        <Badge variant="destructive" className="text-[10px]">
                          Overdue
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Projects */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">My Projects</CardTitle>
              <Link href="/projects">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {!projects || projects.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No projects assigned.
                </p>
              ) : (
                <div className="space-y-3">
                  {projects.map((project: Record<string, unknown>) => (
                    <Link key={project.id as string} href={`/projects/${project.id}`}>
                      <div className="rounded-lg border border-border p-3 transition-colors hover:bg-muted/50">
                        <div className="flex items-center gap-2">
                          <FolderKanban className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <h3 className="text-sm font-medium">
                              {project.project_code as string} - {project.name as string}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {project.status as string}
                            </p>
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div className="mt-2">
                          <div className="h-1.5 w-full rounded-full bg-muted">
                            <div
                              className="h-1.5 rounded-full bg-primary"
                              style={{
                                width: `${project.progress_percent as number}%`,
                              }}
                            />
                          </div>
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            {project.progress_percent as number}%
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/tasks/new">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="mr-2 h-4 w-4" />
                  New Task
                </Button>
              </Link>
              <Link href="/tasks/board">
                <Button variant="outline" className="w-full justify-start">
                  <ListTodo className="mr-2 h-4 w-4" />
                  Task Board
                </Button>
              </Link>
              <Link href="/tasks/my">
                <Button variant="outline" className="w-full justify-start">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  My Tasks
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
