"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PeriodTrend } from "@/types/analytics";

const RevenueTrendChart = dynamic(
  () => import("@/components/analytics/charts/revenue-trend-chart").then((m) => m.RevenueTrendChart),
  {
    loading: () => (
      <Card>
        <CardHeader><CardTitle className="text-sm">Revenue Trend</CardTitle></CardHeader>
        <CardContent>
          <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">Loading chart...</div>
        </CardContent>
      </Card>
    ),
    ssr: false,
  }
);

interface LazyRevenueTrendChartProps {
  revenue: PeriodTrend[];
  payments: PeriodTrend[];
  expenses: PeriodTrend[];
}

export function LazyRevenueTrendChart(props: LazyRevenueTrendChartProps) {
  return <RevenueTrendChart {...props} />;
}
