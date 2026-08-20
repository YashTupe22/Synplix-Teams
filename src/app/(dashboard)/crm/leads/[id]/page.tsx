import { notFound } from "next/navigation";
import { requirePermission, Permission } from "@/lib/authorization-server";
import { getLeadById, getLeadActivities, getLeadNotes } from "@/services/crm";
import { getOpportunities, getCalls, getFollowUps } from "@/services/sales";
import { updateLeadStatusAction, addLeadActivityAction, addLeadNoteAction, archiveLeadAction } from "../actions";
import { LeadDetail } from "@/components/crm/lead-detail";
import { LeadSalesSection } from "@/components/sales/lead-sales-section";
import { DocumentSection } from "@/components/documents/document-section";
import { Separator } from "@/components/ui/separator";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await getLeadById(id);
  return { title: lead ? `${lead.title} | Leads` : "Lead | Synplix Teams" };
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requirePermission(Permission.CRM_VIEW);
  const { id } = await params;
  const lead = await getLeadById(id);

  if (!lead) notFound();

  const [activities, notes, oppsResult, callsResult, followUpsResult] = await Promise.all([
    getLeadActivities(id),
    getLeadNotes(id),
    getOpportunities({ lead_id: id, limit: 10 }, profile).catch(() => ({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 })),
    getCalls({ lead_id: id, limit: 5 }, profile).catch(() => ({ data: [], total: 0, page: 1, limit: 5, totalPages: 0 })),
    getFollowUps({ lead_id: id, limit: 5 }, profile).catch(() => ({ data: [], total: 0, page: 1, limit: 5, totalPages: 0 })),
  ]);

  const isAdmin = profile.role === "admin";
  const isManager = profile.role === "manager";

  return (
    <div className="p-6">
      <LeadDetail
        lead={lead}
        activities={activities}
        notes={notes}
        onStatusChange={updateLeadStatusAction}
        onAddActivity={addLeadActivityAction}
        onAddNote={addLeadNoteAction}
        onArchive={archiveLeadAction}
        isAdmin={isAdmin}
        isManager={isManager}
      />
      <Separator className="my-6" />
      <LeadSalesSection
        leadId={id}
        opportunities={oppsResult.data}
        calls={callsResult.data}
        followUps={followUpsResult.data}
        isAdmin={isAdmin}
        isManager={isManager}
      />
      <Separator className="my-6" />
      <DocumentSection entityType="lead" entityId={id} />
    </div>
  );
}
