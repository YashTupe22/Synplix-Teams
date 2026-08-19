import { requirePermission, Permission } from "@/lib/authorization-server";
import { createLeadAction } from "../actions";
import { LeadForm } from "@/components/crm/lead-form";
import { getLeadSources, getTeamMembersForAssignment, getCompanies, getContacts } from "@/services/crm";

export const metadata = { title: "New Lead | CRM | Synplix Teams" };

export default async function NewLeadPage() {
  await requirePermission(Permission.CRM_MANAGE);

  const [sources, teamMembers, companiesResult, contactsResult] = await Promise.all([
    getLeadSources(),
    getTeamMembersForAssignment(),
    getCompanies({ limit: 100 }),
    getContacts({ limit: 100 }),
  ]);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-semibold">New Lead</h1>
      <LeadForm
        sources={sources}
        teamMembers={teamMembers}
        companies={companiesResult.data}
        contacts={contactsResult.data}
        action={createLeadAction}
      />
    </div>
  );
}
