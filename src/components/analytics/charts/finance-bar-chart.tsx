"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatINR, formatPeriodLabel } from "@/lib/analytics-utils";
import type { PeriodValue } from "@/types/analytics";

interface FinanceBarChartProps {
  revenueByMonth: PeriodValue[];
  paymentsByMonth: PeriodValue[];
  expensesByMonth: PeriodValue[];
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
          <span className="font-medium">{formatINR(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function FinanceBarChart({ revenueByMonth, paymentsByMonth, expensesByMonth }: FinanceBarChartProps) {
  const allPeriods = new Set([
    ...revenueByMonth.map((r) => r.period),
    ...paymentsByMonth.map((p) => p.period),
    ...expensesByMonth.map((e) => e.period),
  ]);

  const data = Array.from(allPeriods)
    .sort()
    .map((period) => ({
      period,
      invoiced: revenueByMonth.find((r) => r.period === period)?.value || 0,
      received: paymentsByMonth.find((p) => p.period === period)?.value || 0,
      expenses: expensesByMonth.find((e) => e.period === period)?.value || 0,
    }));

  if (!data.length) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-sm">Finance Overview</CardTitle></CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            No finance data available for this period
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">Finance Overview</CardTitle></CardHeader>
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
              tickFormatter={(v) => formatINR(v)}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              width={70}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            />
            <Bar dataKey="invoiced" name="Invoiced" fill="#5e6ad2" radius={[2, 2, 0, 0]} />
            <Bar dataKey="received" name="Received" fill="#10b981" radius={[2, 2, 0, 0]} />
            <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
