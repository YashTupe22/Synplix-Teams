"use client";

import {
  DollarSign,
  TrendingUp,
  Trophy,
  XCircle,
  Briefcase,
  Percent,
  Phone,
  CalendarCheck,
  CalendarClock,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SalesMetrics } from "@/types/sales";

interface SalesMetricsGridProps {
  metrics: SalesMetrics;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function SalesMetricsGrid({ metrics }: SalesMetricsGridProps) {
  const cards = [
    {
      title: "Pipeline Value",
      value: formatCurrency(metrics.pipelineValue),
      icon: <DollarSign className="size-4" />,
    },
    {
      title: "Weighted Pipeline",
      value: formatCurrency(metrics.weightedPipeline),
      icon: <TrendingUp className="size-4" />,
    },
    {
      title: "Won This Month",
      value: formatCurrency(metrics.wonValue),
      icon: <Trophy className="size-4" />,
      description: `${metrics.wonThisMonth} deal${metrics.wonThisMonth !== 1 ? "s" : ""}`,
    },
    {
      title: "Lost This Month",
      value: formatCurrency(metrics.lostValue),
      icon: <XCircle className="size-4" />,
      description: `${metrics.lostThisMonth} deal${metrics.lostThisMonth !== 1 ? "s" : ""}`,
    },
    {
      title: "Open Opportunities",
      value: metrics.totalOpen,
      icon: <Briefcase className="size-4" />,
    },
    {
      title: "Conversion Rate",
      value: `${metrics.conversionRate.toFixed(1)}%`,
      icon: <Percent className="size-4" />,
    },
    {
      title: "Calls Today",
      value: metrics.callsToday,
      icon: <Phone className="size-4" />,
    },
    {
      title: "Follow-ups Today",
      value: metrics.followUpsToday,
      icon: <CalendarCheck className="size-4" />,
    },
    {
      title: "Meetings Today",
      value: metrics.meetingsToday,
      icon: <CalendarClock className="size-4" />,
    },
    {
      title: "Overdue Follow-ups",
      value: metrics.overdueFollowUps,
      icon: <AlertTriangle className="size-4" />,
      highlight: metrics.overdueFollowUps > 0,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.title} className="transition-colors hover:bg-muted/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className="text-muted-foreground" aria-hidden="true">
              {card.icon}
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-semibold tracking-tight ${
              "highlight" in card && card.highlight ? "text-amber-600" : ""
            }`}>
              {card.value}
            </div>
            {"description" in card && card.description && (
              <p className="mt-1 text-xs text-muted-foreground">{card.description}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
