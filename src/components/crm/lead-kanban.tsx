"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import {
  LEAD_PRIORITY_CONFIG,
  type PipelineStageData,
} from "@/types/crm";

interface LeadKanbanProps {
  stages: PipelineStageData[];
}

export function LeadKanban({ stages }: LeadKanbanProps) {
  const router = useRouter();
  const hasLeads = stages.some((s) => s.leads.length > 0);

  if (!hasLeads) {
    return (
      <EmptyState
        title="No leads in pipeline"
        description="Create leads to see them organized by status in the pipeline view."
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

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {stages.map((stage) => (
          <div key={stage.status} className="w-72 shrink-0">
            {/* Column header */}
            <div className="mb-3 flex items-center gap-2">
              <span className={`size-2 rounded-full ${stage.color}`} />
              <h3 className="text-sm font-medium">{stage.label}</h3>
              <span className="text-xs text-muted-foreground">({stage.count})</span>
            </div>

            {/* Cards */}
            <div className="space-y-2">
              {stage.leads.map((lead) => {
                const priorityCfg = LEAD_PRIORITY_CONFIG[lead.priority];
                return (
                  <Card
                    key={lead.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => router.push(`/crm/leads/${lead.id}`)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium line-clamp-2">{lead.title}</p>
                        <Badge
                          variant="outline"
                          className={`shrink-0 text-[10px] ${
                            lead.priority === "urgent"
                              ? "border-red-500 text-red-600"
                              : lead.priority === "high"
                                ? "border-orange-500 text-orange-600"
                                : ""
                          }`}
                        >
                          {priorityCfg.label}
                        </Badge>
                      </div>
                      {lead.company && (
                        <p className="mt-1 text-xs text-muted-foreground truncate">
                          {lead.company.name}
                        </p>
                      )}
                      {lead.contact && (
                        <p className="text-xs text-muted-foreground truncate">
                          {lead.contact.first_name} {lead.contact.last_name ?? ""}
                        </p>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        {lead.estimated_value !== null ? (
                          <span className="text-xs font-medium">
                            {formatCurrency(lead.estimated_value, lead.currency)}
                          </span>
                        ) : (
                          <span />
                        )}
                        {lead.assigned_user && (
                          <span className="text-[10px] text-muted-foreground truncate ml-2">
                            {lead.assigned_user.full_name ?? lead.assigned_user.email}
                          </span>
                        )}
                      </div>
                      {lead.next_follow_up_at && (
                        <div className="mt-1.5 text-[10px] text-muted-foreground">
                          Follow-up: {new Date(lead.next_follow_up_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
              {stage.leads.length === 0 && (
                <div className="rounded-lg border border-dashed border-border p-4 text-center">
                  <p className="text-xs text-muted-foreground">No leads</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
