import { requirePermission, Permission } from "@/lib/authorization-server";
import { getLeadById } from "@/services/crm";
import { updateLeadAction } from "../../actions";
import { LeadForm } from "@/components/crm/lead-form";
import { getLeadSources, getTeamMembersForAssignment, getCompanies, getContacts } from "@/services/crm";
import { notFound } from "next/navigation";

export const metadata = { title: "Edit Lead | CRM | Synplix Teams" };

export default async function EditLeadPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission(Permission.CRM_MANAGE);
  const { id } = await params;
  const lead = await getLeadById(id);
  if (!lead) notFound();

  const [sources, teamMembers, companiesResult, contactsResult] = await Promise.all([
    getLeadSources(),
    getTeamMembersForAssignment(),
    getCompanies({ limit: 100 }),
    getContacts({ limit: 100 }),
  ]);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-semibold">Edit Lead</h1>
      <LeadForm
        lead={lead}
        sources={sources}
        teamMembers={teamMembers}
        companies={companiesResult.data}
        contacts={contactsResult.data}
        action={updateLeadAction}
      />
    </div>
  );
}
