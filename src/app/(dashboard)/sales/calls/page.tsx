import { Suspense } from "react";
import { requirePermission, Permission } from "@/lib/authorization-server";
import { getCalls } from "@/services/sales";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CALL_OUTCOME_CONFIG } from "@/types/sales";
import { Plus } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export const metadata = {
  title: "Calls | Sales | Synplix Teams",
};

async function CallList({
  dateFrom,
  dateTo,
  userId,
}: {
  dateFrom?: string;
  dateTo?: string;
  userId?: string;
}) {
  const profile = await requirePermission(Permission.SALES_VIEW);
  const data = await getCalls(
    {
      date_from: dateFrom,
      date_to: dateTo,
      user_id: userId,
      limit: 50,
    },
    profile
  );

  return (
    <div className="space-y-3">
      {data.data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No calls found.</p>
      ) : (
        data.data.map((call) => {
          const outcomeConfig = CALL_OUTCOME_CONFIG[call.outcome];
          return (
            <div
              key={call.id}
              className="flex items-start justify-between rounded-lg border border-border p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {call.lead?.title ?? "Unknown lead"}
                  </span>
                  <Badge variant="outline" className={outcomeConfig?.color}>
                    {outcomeConfig?.label}
                  </Badge>
                </div>
                {call.contact && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {call.contact.first_name} {call.contact.last_name}
                  </p>
                )}
                {call.notes && (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {call.notes}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">
                  {format(new Date(call.started_at), "MMM d, h:mm a")}
                </p>
                {call.user && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {call.user.full_name ?? call.user.email}
                  </p>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

export default async function CallsPage() {
  const profile = await requirePermission(Permission.SALES_VIEW);
  const isAdmin = profile.role === "admin";
  const isManager = profile.role === "manager";

  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  ).toISOString();
  const tomorrowStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + 1
  ).toISOString();

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Calls"
          description="Track and manage your sales calls"
        />
        {(isAdmin || isManager) && (
          <Link
            href="/sales/calls/new"
            className={buttonVariants({ size: "sm" })}
          >
            <Plus className="mr-1.5 size-3.5" />
            Log Call
          </Link>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Today&apos;s Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense
              fallback={
                <div className="space-y-3">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-20 animate-pulse rounded-lg bg-muted"
                    />
                  ))}
                </div>
              }
            >
              <CallList dateFrom={todayStart} dateTo={tomorrowStart} />
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">My Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense
              fallback={
                <div className="space-y-3">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-20 animate-pulse rounded-lg bg-muted"
                    />
                  ))}
                </div>
              }
            >
              <CallList userId={profile.id} />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      {(isAdmin || isManager) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">All Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense
              fallback={
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-20 animate-pulse rounded-lg bg-muted"
                    />
                  ))}
                </div>
              }
            >
              <CallList />
            </Suspense>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
