import { requirePermission, Permission } from "@/lib/authorization-server";
import { getLeads, getContacts, getCompanies } from "@/services/crm";
import { getTeamMembers } from "@/services/projects";
import { createClientAction } from "../actions";
import { ClientForm } from "@/components/clients/client-form";

export const metadata = {
  title: "New Client | Synplix Teams",
};

export default async function NewClientPage() {
  const profile = await requirePermission(Permission.CLIENTS_MANAGE);

  const [_leadsResult, contactsResult, companiesResult, teamMembers] = await Promise.all([
    getLeads({ limit: 100 }, profile),
    getContacts({ limit: 200 }),
    getCompanies({ limit: 200 }),
    getTeamMembers(),
  ]);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-semibold">New Client</h1>
      <ClientForm
        companies={companiesResult.data}
        contacts={contactsResult.data}
        teamMembers={teamMembers}
        action={createClientAction}
      />
    </div>
  );
}
