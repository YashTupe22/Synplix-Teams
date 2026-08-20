import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePermission, Permission } from "@/lib/authorization-server";
import {
  getOpportunityById,
  getCalls,
  getFollowUps,
} from "@/services/sales";
import { createClient } from "@/lib/supabase/server";
import { getTeamMembers } from "@/services/projects";
import { convertToClientAction } from "@/app/(dashboard)/clients/actions";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { SALES_STAGE_CONFIG, OPEN_STAGES } from "@/types/sales";
import { StageChanger } from "@/components/sales/stage-changer";
import { ConvertToClient } from "@/components/sales/convert-to-client";
import { DocumentSection } from "@/components/documents/document-section";
import { format } from "date-fns";
import {
  Pencil,
  Phone,
  CalendarCheck,
  Building2,
  User,
  DollarSign,
  Target,
  Clock,
} from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const opp = await getOpportunityById(id);
  return {
    title: opp ? `${opp.title} | Opportunities` : "Opportunity | Synplix Teams",
  };
}

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requirePermission(Permission.SALES_VIEW);
  const { id } = await params;
  const opp = await getOpportunityById(id);

  if (!opp) notFound();

  const supabase = await createClient();
  const [callsResult, followUpsResult, teamMembers, existingClient] = await Promise.all([
    getCalls({ lead_id: opp.lead_id, limit: 50 }, profile),
    getFollowUps({ lead_id: opp.lead_id, limit: 50 }, profile),
    getTeamMembers(),
    supabase
      .from("clients")
      .select("id, client_code")
      .eq("converted_from_opportunity_id", opp.id)
      .maybeSingle(),
  ]);

  const stageConfig = SALES_STAGE_CONFIG[opp.stage];
  const weightedValue = opp.value * (opp.probability / 100);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title={opp.title}
          description={`Lead: ${opp.lead?.title ?? "N/A"}`}
        />
        <div className="flex items-center gap-2">
          <Link
            href={`/sales/opportunities/${opp.id}/edit`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Pencil className="mr-1.5 size-3.5" />
            Edit
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Target className="size-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Stage:</span>
                  <Badge variant="outline" className={stageConfig?.color}>
                    {stageConfig?.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="size-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Value:</span>
                  <span className="text-sm font-medium">
                    {new Intl.NumberFormat("en-IN", {
                      style: "currency",
                      currency: opp.currency,
                      maximumFractionDigits: 0,
                    }).format(opp.value)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="size-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Probability:
                  </span>
                  <span className="text-sm font-medium">{opp.probability}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="size-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Weighted:
                  </span>
                  <span className="text-sm font-medium">
                    {new Intl.NumberFormat("en-IN", {
                      style: "currency",
                      currency: opp.currency,
                      maximumFractionDigits: 0,
                    }).format(weightedValue)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="size-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Owner:</span>
                  <span className="text-sm font-medium">
                    {opp.owner?.full_name ?? opp.owner?.email ?? "Unassigned"}
                  </span>
                </div>
                {opp.lead_company && (
                  <div className="flex items-center gap-2">
                    <Building2 className="size-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Company:
                    </span>
                    <span className="text-sm font-medium">
                      {opp.lead_company.name}
                    </span>
                  </div>
                )}
                {opp.lead_contact && (
                  <div className="flex items-center gap-2">
                    <User className="size-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Contact:
                    </span>
                    <span className="text-sm font-medium">
                      {opp.lead_contact.first_name} {opp.lead_contact.last_name}
                    </span>
                  </div>
                )}
                {opp.expected_close_date && (
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Expected Close:
                    </span>
                    <span className="text-sm font-medium">
                      {format(new Date(opp.expected_close_date), "MMM d, yyyy")}
                    </span>
                  </div>
                )}
              </div>
              {opp.description && (
                <p className="mt-4 text-sm text-muted-foreground">
                  {opp.description}
                </p>
              )}
            </CardContent>
          </Card>

          {OPEN_STAGES.includes(opp.stage) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Change Stage</CardTitle>
              </CardHeader>
              <CardContent>
                <StageChanger opportunityId={opp.id} currentStage={opp.stage} />
              </CardContent>
            </Card>
          )}

          {opp.stage === "closed_won" && (
            existingClient.data ? (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="size-4 text-green-600" />
                    <span className="text-sm font-medium">Client Already Created</span>
                    <Badge variant="outline" className="text-xs text-green-600">{existingClient.data.client_code}</Badge>
                  </div>
                  <Link
                    href={`/clients/${existingClient.data.id}`}
                    className="mt-2 inline-block text-sm text-primary hover:underline"
                  >
                    View Client →
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <ConvertToClient
                opportunityId={opp.id}
                contactId={opp.lead?.contact_id}
                accountId={opp.owner?.id}
                teamMembers={teamMembers}
                action={convertToClientAction}
              />
            )
          )}

          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-base">Call History</CardTitle>
            </CardHeader>
            <CardContent>
              {callsResult.data.length === 0 ? (
                <p className="text-sm text-muted-foreground">No calls logged.</p>
              ) : (
                <div className="space-y-3">
                  {callsResult.data.map((call) => (
                    <div
                      key={call.id}
                      className="flex items-start justify-between rounded-lg border border-border p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Phone className="size-3.5 text-muted-foreground" />
                          <span className="text-sm font-medium capitalize">
                            {call.outcome.replace(/_/g, " ")}
                          </span>
                        </div>
                        {call.notes && (
                          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                            {call.notes}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(call.started_at), "MMM d, h:mm a")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-base">Follow-ups</CardTitle>
            </CardHeader>
            <CardContent>
              {followUpsResult.data.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No follow-ups scheduled.
                </p>
              ) : (
                <div className="space-y-3">
                  {followUpsResult.data.map((fu) => (
                    <div
                      key={fu.id}
                      className="rounded-lg border border-border p-3"
                    >
                      <div className="flex items-center gap-2">
                        <CalendarCheck className="size-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium">{fu.title}</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                        <span className="capitalize">{fu.type}</span>
                        <span>
                          {format(new Date(fu.scheduled_at), "MMM d, h:mm a")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <DocumentSection entityType="opportunity" entityId={id} />
        </div>
      </div>
    </div>
  );
}
