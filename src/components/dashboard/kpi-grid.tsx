"use client";

import {
  DollarSign,
  TrendingUp,
  Users,
  FolderKanban,
  CheckSquare,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Construction,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { KpiCard } from "@/types/dashboard";

const iconMap = {
  DollarSign,
  TrendingUp,
  Users,
  FolderKanban,
  CheckSquare,
  Clock,
};

interface KpiGridProps {
  kpis: KpiCard[];
  loading?: boolean;
}

export function KpiGrid({ kpis, loading }: KpiGridProps) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[120px] rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {kpis.map((kpi) => (
        <KpiCardItem key={kpi.id} kpi={kpi} />
      ))}
    </div>
  );
}

function KpiCardItem({ kpi }: { kpi: KpiCard }) {
  const Icon = iconMap[kpi.icon as keyof typeof iconMap] ?? CheckSquare;
  const isComingSoon = kpi.status === "coming-soon";

  return (
    <Card
      className={cn(
        "transition-colors",
        isComingSoon ? "opacity-75" : "hover:bg-muted/50"
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {kpi.title}
        </CardTitle>
        <div className="flex items-center gap-2">
          {isComingSoon && (
            <Badge variant="secondary" className="text-[10px]">
              <Construction className="mr-1 size-2.5" />
              Soon
            </Badge>
          )}
          <div className="text-muted-foreground" aria-hidden="true">
            <Icon className="size-4" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold tracking-tight">
            {kpi.value}
          </span>
          {kpi.trend && (
            <span
              className={cn(
                "flex items-center gap-0.5 text-xs font-medium",
                kpi.trend.isPositive ? "text-emerald-600" : "text-red-500"
              )}
            >
              {kpi.trend.isPositive ? (
                <ArrowUpRight className="size-3" />
              ) : (
                <ArrowDownRight className="size-3" />
              )}
              {kpi.trend.value}%
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{kpi.description}</p>
      </CardContent>
    </Card>
  );
}
