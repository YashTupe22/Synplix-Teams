"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { SALES_STAGE_CONFIG, type SalesStage, type OpportunityWithRelations } from "@/types/sales";

interface PipelineStage {
  status: SalesStage;
  label: string;
  opportunities: OpportunityWithRelations[];
  color: string;
}

interface PipelineKanbanProps {
  stages: PipelineStage[];
}

export function PipelineKanban({ stages }: PipelineKanbanProps) {
  const router = useRouter();
  const hasOpportunities = stages.some((s) => s.opportunities.length > 0);

  if (!hasOpportunities) {
    return (
      <EmptyState
        title="No opportunities in pipeline"
        description="Create opportunities to see them organized by stage in the pipeline view."
      />
    );
  }

  const formatCurrency = (value: number | null, currency: string) => {
    if (value === null) return null;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: string | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {stages.map((stage) => {
          const totalValue = stage.opportunities.reduce((sum, o) => sum + (o.value || 0), 0);
          return (
            <div key={stage.status} className="w-80 shrink-0">
              {/* Column header */}
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`size-2 rounded-full ${stage.color}`} />
                  <h3 className="text-sm font-medium">{stage.label}</h3>
                  <span className="text-xs text-muted-foreground">({stage.opportunities.length})</span>
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  {formatCurrency(totalValue, "INR") ?? "₹0"}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-2">
                {stage.opportunities.map((opp) => {
                  const stageCfg = SALES_STAGE_CONFIG[opp.stage];
                  return (
                    <Card
                      key={opp.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => router.push(`/sales/opportunities/${opp.id}`)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium line-clamp-2">{opp.title}</p>
                          <Badge
                            variant="outline"
                            className={`shrink-0 text-[10px] ${stageCfg.color}`}
                          >
                            {stageCfg.label}
                          </Badge>
                        </div>
                        {opp.lead_company && (
                          <p className="mt-1 text-xs text-muted-foreground truncate">
                            {opp.lead_company.name}
                          </p>
                        )}
                        {opp.lead_contact && (
                          <p className="text-xs text-muted-foreground truncate">
                            {opp.lead_contact.first_name} {opp.lead_contact.last_name ?? ""}
                          </p>
                        )}
                        {opp.owner && (
                          <p className="text-[10px] text-muted-foreground truncate">
                            {opp.owner.full_name ?? opp.owner.email}
                          </p>
                        )}
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className="font-medium">
                            {formatCurrency(opp.value, opp.currency) ?? "—"}
                          </span>
                          <div className="flex items-center gap-3 text-muted-foreground">
                            <span>{opp.probability}%</span>
                            <span>
                              {formatCurrency(opp.value * opp.probability / 100, opp.currency) ?? "—"}
                            </span>
                          </div>
                        </div>
                        {opp.expected_close_date && (
                          <div className="mt-1.5 text-[10px] text-muted-foreground">
                            Close: {formatDate(opp.expected_close_date)}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
                {stage.opportunities.length === 0 && (
                  <div className="rounded-lg border border-dashed border-border p-4 text-center">
                    <p className="text-xs text-muted-foreground">No opportunities</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
