import { getDashboardSummary } from "@/services/dashboard";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { Suspense } from "react";

export const metadata = {
  title: "Dashboard | Synplix Teams",
  description: "Synplix internal dashboard overview",
};

async function DashboardData() {
  const summary = await getDashboardSummary();
  return <DashboardContent data={summary} />;
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardData />
    </Suspense>
  );
}
