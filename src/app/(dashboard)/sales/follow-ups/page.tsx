import { Suspense } from "react";
import Link from "next/link";
import { requirePermission, Permission } from "@/lib/authorization-server";
import { getFollowUps } from "@/services/sales";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FOLLOW_UP_STATUS_CONFIG, FOLLOW_UP_TYPE_CONFIG } from "@/types/sales";
import type { FollowUpStatus } from "@/types/sales";
import { Plus, CalendarCheck } from "lucide-react";
import { format } from "date-fns";

export const metadata = {
  title: "Follow-ups | Sales | Synplix Teams",
};

async function FollowUpTab({
  title,
  status,
  dateFrom,
  dateTo,
}: {
  title: string;
  status?: FollowUpStatus[];
  dateFrom?: string;
  dateTo?: string;
}) {
  const profile = await requirePermission(Permission.SALES_VIEW);
  const data = await getFollowUps(
    {
      status,
      date_from: dateFrom,
      date_to: dateTo,
      limit: 50,
    },
    profile
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No follow-ups.</p>
        ) : (
          <div className="space-y-3">
            {data.data.map((fu) => {
              const statusConfig = FOLLOW_UP_STATUS_CONFIG[fu.status];
              const typeConfig = FOLLOW_UP_TYPE_CONFIG[fu.type];
              return (
                <div
                  key={fu.id}
                  className="flex items-start justify-between rounded-lg border border-border p-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{fu.title}</span>
                      <Badge
                        variant="outline"
                        className={statusConfig?.color}
                      >
                        {statusConfig?.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {typeConfig?.label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {fu.lead?.title ?? "Unknown lead"}
                    </p>
                    {fu.assigned_user && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Assigned to: {fu.assigned_user.full_name ?? fu.assigned_user.email}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CalendarCheck className="size-3.5" />
                      {format(new Date(fu.scheduled_at), "MMM d, h:mm a")}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default async function FollowUpsPage() {
  const profile = await requirePermission(Permission.SALES_VIEW);
  const isAdmin = profile.role === "admin";
  const isManager = profile.role === "manager";

  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).toISOString();
  const tomorrowStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1
  ).toISOString();

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Follow-ups"
          description="Manage your scheduled follow-ups and tasks"
        />
        {(isAdmin || isManager) && (
          <Link
            href="/sales/follow-ups/new"
            className={buttonVariants({ size: "sm" })}
          >
            <Plus className="mr-1.5 size-3.5" />
            Create Follow-up
          </Link>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Suspense
          fallback={
            <Card>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-20 animate-pulse rounded-lg bg-muted"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          }
        >
          <FollowUpTab
            title="Today"
            status={["pending"]}
            dateFrom={todayStart}
            dateTo={tomorrowStart}
          />
        </Suspense>

        <Suspense
          fallback={
            <Card>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-20 animate-pulse rounded-lg bg-muted"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          }
        >
          <FollowUpTab
            title="Overdue"
            status={["pending"]}
            dateTo={todayStart}
          />
        </Suspense>

        <Suspense
          fallback={
            <Card>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-20 animate-pulse rounded-lg bg-muted"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          }
        >
          <FollowUpTab
            title="Upcoming"
            status={["pending"]}
            dateFrom={tomorrowStart}
          />
        </Suspense>

        <Suspense
          fallback={
            <Card>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-20 animate-pulse rounded-lg bg-muted"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          }
        >
          <FollowUpTab title="Completed" status={["completed"]} />
        </Suspense>
      </div>
    </div>
  );
}
