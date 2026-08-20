import { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/authorization-server";
import { Permission } from "@/lib/authorization";
import { getTasks, getTaskMetrics } from "@/services/tasks";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Clock, Users } from "lucide-react";
import Link from "next/link";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: member } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", id)
    .single();

  return {
    title: member
      ? `${member.full_name || member.email} - Tasks`
      : "Member Not Found",
    description: "Team member task overview",
  };
}

export default async function TeamMemberTasksPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(Permission.TASKS_MANAGE);
  const { id } = await params;

  const supabase = await createClient();

  const { data: member } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("id", id)
    .single();

  if (!member) notFound();

  const [result, metrics] = await Promise.all([
    getTasks({ assigned_to: id, limit: 100 }),
    getTaskMetrics(undefined, id),
  ]);

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title={member.full_name || member.email}
        description={`Tasks assigned to ${member.full_name || member.email}`}
      />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{metrics.total}</p>
                <p className="text-xs text-muted-foreground">Total Tasks</p>
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
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{metrics.overdue}</p>
                <p className="text-xs text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {result.data.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No tasks assigned to this member.
          </div>
        ) : (
          result.data.map((task) => (
            <Link key={task.id} href={`/tasks/${task.id}`}>
              <div className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted/50">
                <div>
                  <h3 className="text-sm font-medium">{task.title}</h3>
                  <span className="text-xs text-muted-foreground">
                    {task.project?.project_code} - {task.project?.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    {task.status.replace("_", " ")}
                  </Badge>
                  {task.due_date && (
                    <span className="text-xs text-muted-foreground">
                      Due {new Date(task.due_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
