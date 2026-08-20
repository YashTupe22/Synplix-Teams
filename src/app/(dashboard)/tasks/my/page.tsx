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
  AlertTriangle,
  Clock,
  CheckCircle,
  Calendar,
} from "lucide-react";

export const metadata: Metadata = {
  title: "My Tasks | Synplix Infotech",
  description: "Your assigned tasks",
};

export default async function MyTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const profile = await requirePermission(Permission.TASKS_VIEW);
  const params = await searchParams;

  const filters = {
    assigned_to: profile.id,
    status: params.status ? [params.status as never] : undefined,
    page: params.page ? parseInt(params.page) : 1,
    limit: 50,
  };

  const [result, metrics] = await Promise.all([
    getTasks(filters),
    getTaskMetrics(undefined, profile.id),
  ]);

  const today = new Date().toISOString().split("T")[0];

  const todayTasks = result.data.filter(
    (t) => t.due_date === today && t.status !== "completed" && t.status !== "cancelled"
  );

  const overdueTasks = result.data.filter(
    (t) =>
      t.due_date &&
      t.due_date < today &&
      t.status !== "completed" &&
      t.status !== "cancelled"
  );

  const upcomingTasks = result.data.filter(
    (t) =>
      t.due_date &&
      t.due_date > today &&
      t.status !== "completed" &&
      t.status !== "cancelled"
  );

  const completedTasks = result.data.filter((t) => t.status === "completed");

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="My Tasks"
        description="Your assigned tasks and upcoming work"
      >
        <Link href="/tasks/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
        </Link>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* Today's Tasks */}
      {todayTasks.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Today&apos;s Tasks</h2>
          <div className="space-y-2">
            {todayTasks.map((task) => (
              <Link key={task.id} href={`/tasks/${task.id}`}>
                <div className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted/50">
                  <div>
                    <h3 className="text-sm font-medium">{task.title}</h3>
                    <span className="text-xs text-muted-foreground">
                      {task.project?.project_code} - {task.project?.name}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {task.priority}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Overdue Tasks */}
      {overdueTasks.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 text-red-600">
            Overdue Tasks
          </h2>
          <div className="space-y-2">
            {overdueTasks.map((task) => (
              <Link key={task.id} href={`/tasks/${task.id}`}>
                <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3 transition-colors hover:bg-red-100">
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
        </div>
      )}

      {/* Upcoming Tasks */}
      {upcomingTasks.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Upcoming Tasks</h2>
          <div className="space-y-2">
            {upcomingTasks.slice(0, 10).map((task) => (
              <Link key={task.id} href={`/tasks/${task.id}`}>
                <div className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted/50">
                  <div>
                    <h3 className="text-sm font-medium">{task.title}</h3>
                    <span className="text-xs text-muted-foreground">
                      {task.project?.project_code} - Due{" "}
                      {new Date(task.due_date!).toLocaleDateString()}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {task.priority}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recently Completed */}
      {completedTasks.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Recently Completed</h2>
          <div className="space-y-2">
            {completedTasks.slice(0, 10).map((task) => (
              <Link key={task.id} href={`/tasks/${task.id}`}>
                <div className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted/50 opacity-70">
                  <div>
                    <h3 className="text-sm font-medium line-through">
                      {task.title}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {task.project?.project_code}
                    </span>
                  </div>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {result.data.length === 0 && (
        <div className="py-8 text-center text-muted-foreground">
          No tasks assigned to you yet.
        </div>
      )}
    </div>
  );
}
