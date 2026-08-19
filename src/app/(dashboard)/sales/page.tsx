import { Suspense } from "react";
import Link from "next/link";
import { requirePermission, Permission } from "@/lib/authorization-server";
import { getSalesMetrics, getOpportunities, getFollowUps } from "@/services/sales";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Phone,
  CalendarCheck,
  AlertTriangle,
} from "lucide-react";
import { SALES_STAGE_CONFIG } from "@/types/sales";
import { format } from "date-fns";

export const metadata = {
  title: "Sales | Synplix Teams",
};

async function SalesMetrics() {
  const profile = await requirePermission(Permission.SALES_VIEW);
  const metrics = await getSalesMetrics(profile);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Pipeline Value
          </CardTitle>
          <DollarSign className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">
            {new Intl.NumberFormat("en-IN", {
              style: "currency",
              currency: "INR",
              maximumFractionDigits: 0,
            }).format(metrics.pipelineValue)}
          </div>
          <p className="text-xs text-muted-foreground">
            {metrics.totalOpen} open opportunities
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Won This Month
          </CardTitle>
          <TrendingUp className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold text-green-600">
            {metrics.wonThisMonth}
          </div>
          <p className="text-xs text-muted-foreground">
            Conversion: {metrics.conversionRate}%
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Calls Today
          </CardTitle>
          <Phone className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{metrics.callsToday}</div>
          <p className="text-xs text-muted-foreground">
            {metrics.meetingsToday} meetings scheduled
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Overdue Follow-ups
          </CardTitle>
          <AlertTriangle className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold text-red-600">
            {metrics.overdueFollowUps}
          </div>
          <p className="text-xs text-muted-foreground">
            {metrics.followUpsToday} due today
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

async function RecentOpportunities() {
  const profile = await requirePermission(Permission.SALES_VIEW);
  const data = await getOpportunities({ limit: 5 }, profile);

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-base">Recent Opportunities</CardTitle>
        <Link
          href="/sales/opportunities"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          View all <ArrowRight className="ml-1 size-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {data.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No opportunities yet.</p>
        ) : (
          <div className="space-y-3">
            {data.data.map((opp) => (
              <Link
                key={opp.id}
                href={`/sales/opportunities/${opp.id}`}
                className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{opp.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {opp.lead?.title ?? "No lead"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={SALES_STAGE_CONFIG[opp.stage]?.color}>
                    {SALES_STAGE_CONFIG[opp.stage]?.label}
                  </Badge>
                  <span className="text-sm font-medium">
                    {new Intl.NumberFormat("en-IN", {
                      style: "currency",
                      currency: opp.currency,
                      maximumFractionDigits: 0,
                    }).format(opp.value)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

async function UpcomingFollowUps() {
  const profile = await requirePermission(Permission.SALES_VIEW);
  const data = await getFollowUps(
    {
      status: ["pending"],
      date_from: new Date().toISOString(),
      limit: 5,
    },
    profile
  );

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-base">Upcoming Follow-ups</CardTitle>
        <Link
          href="/sales/follow-ups"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          View all <ArrowRight className="ml-1 size-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {data.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming follow-ups.</p>
        ) : (
          <div className="space-y-3">
            {data.data.map((fu) => (
              <div
                key={fu.id}
                className="flex items-center justify-between rounded-lg border border-border p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{fu.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {fu.lead?.title ?? "No lead"}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarCheck className="size-3.5" />
                  {format(new Date(fu.scheduled_at), "MMM d, h:mm a")}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default async function SalesPage() {
  const profile = await requirePermission(Permission.SALES_VIEW);
  const isAdmin = profile.role === "admin";
  const isManager = profile.role === "manager";

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Sales"
          description="Track your pipeline, calls, and follow-ups"
        />
        {(isAdmin || isManager) && (
          <Link
            href="/sales/opportunities/new"
            className={buttonVariants({ size: "sm" })}
          >
            <Plus className="mr-1.5 size-3.5" />
            New Opportunity
          </Link>
        )}
      </div>

      <Suspense
        fallback={
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                  <div className="mt-2 h-8 w-32 animate-pulse rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        }
      >
        <SalesMetrics />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-2">
        <Suspense
          fallback={
            <Card>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-16 animate-pulse rounded-lg bg-muted"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          }
        >
          <RecentOpportunities />
        </Suspense>

        <Suspense
          fallback={
            <Card>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-16 animate-pulse rounded-lg bg-muted"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          }
        >
          <UpcomingFollowUps />
        </Suspense>
      </div>
    </div>
  );
}
