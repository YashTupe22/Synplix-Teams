import { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/lib/authorization-server";
import { Permission } from "@/lib/authorization";
import { getTeamTaskMetrics } from "@/services/tasks";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Team Tasks | Synplix Infotech",
  description: "Overview of team task performance",
};

export default async function TeamTasksPage() {
  await requirePermission(Permission.TASKS_MANAGE);

  const teamMetrics = await getTeamTaskMetrics();

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Team Tasks"
        description="Overview of team task performance and workload"
      />

      {teamMetrics.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          No team members with assigned tasks.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teamMetrics.map((member) => (
            <Link key={member.user_id} href={`/tasks/team/${member.user_id}`}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">
                        {member.full_name || member.email}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {member.email}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-lg font-bold">{member.total}</p>
                        <p className="text-[10px] text-muted-foreground">
                          Total
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-lg font-bold">
                          {member.inProgress}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          In Progress
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-lg font-bold">
                          {member.completed}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Completed
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <div>
                        <p className="text-lg font-bold">{member.overdue}</p>
                        <p className="text-[10px] text-muted-foreground">
                          Overdue
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
