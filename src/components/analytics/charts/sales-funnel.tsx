"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { FunnelStage } from "@/types/analytics";

interface SalesFunnelProps {
  stages: FunnelStage[];
}

export function SalesFunnel({ stages }: SalesFunnelProps) {
  if (!stages.length) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-sm">Sales Funnel</CardTitle></CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            No funnel data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">Sales Funnel</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-2">
          {stages.map((stage, i) => {
            const widthPercent = Math.max((stage.count / maxCount) * 100, 8);
            const convRate = i > 0 && stages[i - 1].count > 0
              ? ((stage.count / stages[i - 1].count) * 100).toFixed(0)
              : null;

            return (
              <div key={stage.stage} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">{stage.stage}</span>
                  <span className="text-muted-foreground">
                    {stage.count.toLocaleString()}
                    {convRate && <span className="ml-1 text-muted-foreground/60">({convRate}%)</span>}
                  </span>
                </div>
                <div className="relative h-8 w-full overflow-hidden rounded-md bg-muted/50">
                  <div
                    className="absolute inset-y-0 left-0 rounded-md bg-gradient-to-r from-[#5e6ad2] to-[#7170ff] transition-all duration-500"
                    style={{ width: `${widthPercent}%` }}
                  />
                  <div className="relative z-10 flex h-full items-center px-3">
                    <span className="text-xs font-medium text-white">
                      {stage.count > 0 ? stage.count.toLocaleString() : ""}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
