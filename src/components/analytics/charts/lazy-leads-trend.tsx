"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PeriodTrend } from "@/types/analytics";

const LeadsTrendChartInner = dynamic(
  () => import("@/components/analytics/charts/leads-trend-chart").then((m) => m.LeadsTrendChart),
  {
    loading: () => (
      <Card>
        <CardHeader><CardTitle className="text-sm">Leads & Opportunities Trend</CardTitle></CardHeader>
        <CardContent>
          <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">Loading chart...</div>
        </CardContent>
      </Card>
    ),
    ssr: false,
  }
);

interface LazyLeadsTrendChartProps {
  leads: PeriodTrend[];
  opportunities: PeriodTrend[];
}

export function LazyLeadsTrendChart(props: LazyLeadsTrendChartProps) {
  return <LeadsTrendChartInner {...props} />;
}
