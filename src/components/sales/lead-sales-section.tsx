"use client";

import Link from "next/link";
import { Phone, Calendar, DollarSign, Plus, ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import {
  SALES_STAGE_CONFIG,
  CALL_OUTCOME_CONFIG,
  FOLLOW_UP_STATUS_CONFIG,
  FOLLOW_UP_TYPE_CONFIG,
  type OpportunityWithRelations,
  type CallWithRelations,
  type FollowUpWithRelations,
} from "@/types/sales";

interface LeadSalesSectionProps {
  leadId: string;
  opportunities: OpportunityWithRelations[];
  calls: CallWithRelations[];
  followUps: FollowUpWithRelations[];
  isAdmin: boolean;
  isManager: boolean;
}

export function LeadSalesSection({ leadId, opportunities, calls, followUps, isAdmin, isManager }: LeadSalesSectionProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Sales Opportunities</CardTitle>
          {(isAdmin || isManager) && (
            <Link href={`/sales/opportunities/new?lead_id=${leadId}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
              <Plus className="mr-1 size-3" /> Create
            </Link>
          )}
        </CardHeader>
        <CardContent>
          {opportunities.length === 0 ? (
            <EmptyState title="No opportunities" description="Create a sales opportunity for this lead." className="py-6" />
          ) : (
            <div className="space-y-3">
              {opportunities.map((opp) => {
                const stageCfg = SALES_STAGE_CONFIG[opp.stage];
                return (
                  <Link key={opp.id} href={`/sales/opportunities/${opp.id}`} className="group block">
                    <div className="rounded-lg border border-border p-3 transition-colors group-hover:bg-muted/50">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{opp.title}</p>
                          <p className="text-xs text-muted-foreground">{opp.owner?.full_name ?? opp.owner?.email}</p>
                        </div>
                        <Badge variant="outline" className={`shrink-0 text-[10px] ${stageCfg.color}`}>{stageCfg.label}</Badge>
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <DollarSign className="size-3" />
                          {new Intl.NumberFormat("en-IN", { style: "currency", currency: opp.currency, maximumFractionDigits: 0 }).format(opp.value)}
                        </span>
                        <span>{opp.probability}% probability</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2"><Phone className="size-4" /> Recent Calls</CardTitle>
          <Link href={`/sales/calls?lead_id=${leadId}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>View all <ArrowRight className="ml-1 size-3" /></Link>
        </CardHeader>
        <CardContent>
          {calls.length === 0 ? (
            <EmptyState title="No calls" description="Log a call for this lead." className="py-6" />
          ) : (
            <div className="space-y-2">
              {calls.slice(0, 5).map((call) => {
                const outcomeCfg = CALL_OUTCOME_CONFIG[call.outcome];
                return (
                  <div key={call.id} className="flex items-center justify-between rounded-lg border border-border p-2.5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{call.user?.full_name ?? call.user?.email}</span>
                        <Badge variant="outline" className={`text-[10px] ${outcomeCfg.color}`}>{outcomeCfg.label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(call.started_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        {call.duration_seconds != null && ` · ${Math.floor(call.duration_seconds / 60)}m ${call.duration_seconds % 60}s`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2"><Calendar className="size-4" /> Follow-ups</CardTitle>
          <Link href={`/sales/follow-ups?lead_id=${leadId}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>View all <ArrowRight className="ml-1 size-3" /></Link>
        </CardHeader>
        <CardContent>
          {followUps.length === 0 ? (
            <EmptyState title="No follow-ups" description="Schedule a follow-up for this lead." className="py-6" />
          ) : (
            <div className="space-y-2">
              {followUps.slice(0, 5).map((fu) => {
                const statusCfg = FOLLOW_UP_STATUS_CONFIG[fu.status];
                const typeCfg = FOLLOW_UP_TYPE_CONFIG[fu.type];
                return (
                  <div key={fu.id} className="flex items-center justify-between rounded-lg border border-border p-2.5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{fu.title}</span>
                        <Badge variant="outline" className="text-[10px]">{typeCfg.label}</Badge>
                        <Badge variant="outline" className={`text-[10px] ${statusCfg.color}`}>{statusCfg.label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(fu.scheduled_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        {" · "}{fu.assigned_user?.full_name ?? fu.assigned_user?.email}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
