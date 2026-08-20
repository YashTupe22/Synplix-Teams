import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AnalyticsContent } from "@/components/analytics/analytics-content";
import { AnalyticsSkeleton } from "@/components/analytics/analytics-skeleton";
import {
  getAnalyticsSummary,
  getAnalyticsSales,
  getAnalyticsSalesTeam,
  getAnalyticsClients,
  getAnalyticsProjects,
  getAnalyticsTeam,
  getAnalyticsFinance,
  getAnalyticsTimeSeries,
  getAnalyticsFunnel,
} from "@/services/analytics";
import type { UserRole } from "@/types/database";
import type { DateRangePreset } from "@/types/analytics";

export const metadata = {
  title: "Analytics | Synplix Teams",
  description: "Business intelligence dashboard",
};

async function AnalyticsData({ preset }: { preset: DateRangePreset }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .single();

  if (!profile?.is_active) redirect("/login");

  const role = profile.role as UserRole;
  const isAdmin = role === "admin";
  const isManager = role === "manager";
  const canViewFinance = isAdmin || isManager;
  const canViewTeam = isAdmin || isManager;

  const query = { dateRange: { preset, from: null, to: null } };

  const [summary, sales, funnel, timeSeries, clients, projects] = await Promise.all([
    getAnalyticsSummary(query),
    getAnalyticsSales(query),
    getAnalyticsFunnel(query),
    getAnalyticsTimeSeries(query),
    getAnalyticsClients(query),
    getAnalyticsProjects(query),
  ]);

  let finance = null;
  let team = null;
  let salesTeam = null;

  if (canViewFinance) {
    finance = await getAnalyticsFinance(query);
  }
  if (canViewTeam) {
    [team, salesTeam] = await Promise.all([
      getAnalyticsTeam(query),
      getAnalyticsSalesTeam(query),
    ]);
  }

  return (
    <AnalyticsContent
      role={role}
      initialData={{
        summary,
        sales,
        funnel,
        timeSeries,
        clients,
        projects,
        finance,
        team,
        salesTeam,
      }}
      initialPreset={preset}
    />
  );
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string }>;
}) {
  const params = await searchParams;
  const preset = (params.preset || "month") as DateRangePreset;

  return (
    <Suspense fallback={<AnalyticsSkeleton />}>
      <AnalyticsData preset={preset} />
    </Suspense>
  );
}
