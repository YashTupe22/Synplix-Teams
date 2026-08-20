"use client";

import { Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { SectionCard } from "@/components/section-card";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Priority } from "@/types/dashboard";

interface PrioritiesListProps {
  priorities: Priority[];
  loading?: boolean;
}

const statusConfig = {
  pending: {
    icon: Clock,
    variant: "secondary" as const,
    label: "Pending",
  },
  overdue: {
    icon: AlertTriangle,
    variant: "destructive" as const,
    label: "Overdue",
  },
  completed: {
    icon: CheckCircle2,
    variant: "default" as const,
    label: "Done",
  },
};

export function PrioritiesList({ priorities, loading }: PrioritiesListProps) {
  if (loading) {
    return (
      <SectionCard title="Today's Priorities" description="Loading priorities...">
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-md border border-border p-3">
              <Skeleton className="size-4" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/4" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Today's Priorities"
      description={
        priorities.length > 0
          ? `${priorities.length} item${priorities.length === 1 ? "" : "s"} need attention`
          : "Tasks due today will appear here"
      }
    >
      {priorities.length === 0 ? (
        <EmptyState
          icon={<Clock className="size-6" />}
          title="No priorities"
          description="No tasks due today or overdue. You're all clear!"
        />
      ) : (
        <div className="space-y-2">
          {priorities.map((priority) => {
            const config = statusConfig[priority.status];
            const StatusIcon = config.icon;
            return (
              <div
                key={priority.id}
                className="flex items-center justify-between rounded-md border border-border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <StatusIcon
                    className={cn(
                      "size-4 shrink-0",
                      priority.status === "overdue"
                        ? "text-red-500"
                        : priority.status === "completed"
                          ? "text-emerald-500"
                          : "text-muted-foreground"
                    )}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{priority.title}</p>
                    <p className="text-xs text-muted-foreground">{priority.module}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {priority.dueIn && (
                    <Badge variant="outline" className="text-xs">
                      {priority.dueIn}
                    </Badge>
                  )}
                  <Badge variant={config.variant} className="text-xs">
                    {config.label}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}
