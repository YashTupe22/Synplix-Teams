"use client";

import { TrendingUp } from "lucide-react";
import { SectionCard } from "@/components/section-card";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { PipelineStage } from "@/types/dashboard";

interface SalesPipelineProps {
  stages: PipelineStage[];
  loading?: boolean;
}

export function SalesPipeline({ stages, loading }: SalesPipelineProps) {
  if (loading) {
    return (
      <SectionCard title="Sales Pipeline" description="Loading pipeline...">
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-3.5 w-12" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      </SectionCard>
    );
  }

  const hasData = stages.some((s) => s.count > 0);

  return (
    <SectionCard
      title="Sales Pipeline"
      description="Lead pipeline overview"
    >
      {!hasData ? (
        <EmptyState
          icon={<TrendingUp className="size-6" />}
          title="No pipeline data"
          description="Your sales pipeline stages will populate as leads are created."
          className="py-8"
        />
      ) : (
        <div className="space-y-3">
          {stages.map((stage) => (
            <div key={stage.id}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-medium">{stage.name}</span>
                <span className="text-muted-foreground">
                  {stage.count} lead{stage.count === 1 ? "" : "s"}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${stage.color}`}
                  style={{
                    width: `${Math.max((stage.count / Math.max(...stages.map((s) => s.count), 1)) * 100, stage.count > 0 ? 8 : 0)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
