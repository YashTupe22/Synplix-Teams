import { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/lib/authorization-server";
import { Permission } from "@/lib/authorization";
import { getTasks, getTaskMetrics } from "@/services/tasks";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  ListTodo,
  Clock,
  AlertTriangle,
  CheckCircle,
  Calendar,
  LayoutGrid,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Tasks | Synplix Infotech",
  description: "Manage your tasks",
};

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const profile = await requirePermission(Permission.TASKS_VIEW);
  const params = await searchParams;

  const filters = {
    search: params.search,
    status: params.status ? [params.status as never] : undefined,
    priority: params.priority ? [params.priority as never] : undefined,
    overdue: params.overdue === "true",
    page: params.page ? parseInt(params.page) : 1,
    limit: 20,
  };

  const [result, metrics] = await Promise.all([
    getTasks(filters),
    getTaskMetrics(),
  ]);

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Tasks"
        description="Manage and track all tasks across projects"
      >
        <Link href="/tasks/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
        </Link>
      </PageHeader>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <ListTodo className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{metrics.todo}</p>
                <p className="text-xs text-muted-foreground">To Do</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-blue-600" />
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
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{metrics.blocked}</p>
                <p className="text-xs text-muted-foreground">Blocked</p>
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

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{metrics.overdue}</p>
                <p className="text-xs text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="flex flex-wrap gap-2">
        <Link href="/tasks/my">
          <Button variant="outline" size="sm">
            My Tasks
          </Button>
        </Link>
        <Link href="/tasks/team">
          <Button variant="outline" size="sm">
            Team Tasks
          </Button>
        </Link>
        <Link href="/tasks/board">
          <Button variant="outline" size="sm">
            <LayoutGrid className="mr-2 h-4 w-4" />
            Board View
          </Button>
        </Link>
      </div>

      {/* Task List */}
      <div className="rounded-lg border border-border">
        <div className="p-4">
          <div className="space-y-2">
            {result.data.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No tasks found.
              </div>
            ) : (
              result.data.map((task) => (
                <Link key={task.id} href={`/tasks/${task.id}`}>
                  <div className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="text-sm font-medium">{task.title}</h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          {task.project && (
                            <span>{task.project.project_code}</span>
                          )}
                          {task.assignee && (
                            <span>
                              {task.assignee.full_name || task.assignee.email}
                            </span>
                          )}
                          {task.due_date && (
                            <span>
                              Due{" "}
                              {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {task.status.replace("_", " ")}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {task.priority}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
