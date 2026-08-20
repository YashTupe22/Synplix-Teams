"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatINR, formatPeriodLabel } from "@/lib/analytics-utils";
import type { PeriodTrend } from "@/types/analytics";

interface LeadsTrendChartProps {
  leads: PeriodTrend[];
  opportunities: PeriodTrend[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-background p-3 shadow-md">
      <p className="mb-1 text-xs font-medium text-muted-foreground">{formatPeriodLabel(label)}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-xs">
          <div className="size-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export function LeadsTrendChart({ leads, opportunities }: LeadsTrendChartProps) {
  const allPeriods = new Set([
    ...leads.map((l) => l.period),
    ...opportunities.map((o) => o.period),
  ]);

  const data = Array.from(allPeriods)
    .sort()
    .map((period) => ({
      period,
      leads: leads.find((l) => l.period === period)?.value || 0,
      opportunities: opportunities.find((o) => o.period === period)?.value || 0,
    }));

  if (!data.length) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-sm">Leads & Opportunities Trend</CardTitle></CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            No data available for this period
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">Leads & Opportunities Trend</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="period"
              tickFormatter={formatPeriodLabel}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="leads" name="Leads" fill="#5e6ad2" radius={[2, 2, 0, 0]} />
            <Bar dataKey="opportunities" name="Opportunities" fill="#7170ff" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
