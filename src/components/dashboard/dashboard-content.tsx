"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { PrioritiesList } from "@/components/dashboard/priorities-list";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { SalesPipeline } from "@/components/dashboard/sales-pipeline";
import { ProjectOverview } from "@/components/dashboard/project-overview";
import type { DashboardSummary } from "@/types/dashboard";
import type { UserRole } from "@/types/database";

interface DashboardContentProps {
  data: DashboardSummary;
}

export function DashboardContent({ data }: DashboardContentProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const role = data.user.role as UserRole;
  const isAdmin = role === "admin";
  const isManager = role === "manager";

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title={`${data.greeting}, ${data.user.full_name?.split(" ")[0] ?? data.user.email.split("@")[0]} 👋`}
          description={data.currentDate}
        />
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isPending}
            aria-label="Refresh dashboard"
          >
            <RefreshCw
              className={`size-3.5 ${isPending ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <section aria-label="Key performance indicators">
        <KpiGrid kpis={data.kpis} />
      </section>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's Priorities */}
        <div className="lg:col-span-1">
          <PrioritiesList priorities={data.priorities} />
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <RecentActivity
            activities={data.recentActivity}
            isAdmin={isAdmin}
          />
        </div>
      </div>

      {/* Second row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales Pipeline - admin/manager only */}
        {(isAdmin || isManager) && (
          <SalesPipeline stages={data.salesPipeline} />
        )}

        {/* Project Overview */}
        <ProjectOverview projects={data.projects} />

        {/* Quick Actions - fills remaining space */}
        {(isAdmin || isManager) && (
          <div className={!(isAdmin || isManager) ? "lg:col-span-2" : ""}>
            <QuickActions actions={data.quickActions} />
          </div>
        )}
      </div>

      {/* Status footer */}
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center">
        <p className="text-xs text-muted-foreground">
          CRM and Sales modules active. Projects, Tasks, and Finance coming in future phases.
        </p>
      </div>
    </div>
  );
}
