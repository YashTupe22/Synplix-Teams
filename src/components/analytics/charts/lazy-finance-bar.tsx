"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PeriodValue } from "@/types/analytics";

const FinanceBarChartInner = dynamic(
  () => import("@/components/analytics/charts/finance-bar-chart").then((m) => m.FinanceBarChart),
  {
    loading: () => (
      <Card>
        <CardHeader><CardTitle className="text-sm">Finance Overview</CardTitle></CardHeader>
        <CardContent>
          <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">Loading chart...</div>
        </CardContent>
      </Card>
    ),
    ssr: false,
  }
);

interface LazyFinanceBarChartProps {
  revenueByMonth: PeriodValue[];
  paymentsByMonth: PeriodValue[];
  expensesByMonth: PeriodValue[];
}

export function LazyFinanceBarChart(props: LazyFinanceBarChartProps) {
  return <FinanceBarChartInner {...props} />;
}
