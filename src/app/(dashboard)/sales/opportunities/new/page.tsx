import { requirePermission, Permission } from "@/lib/authorization-server";
import { getTeamMembers } from "@/services/sales";
import { getLeads } from "@/services/crm";
import { createOpportunityAction } from "../../actions";
import { OpportunityForm } from "@/components/sales/opportunity-form";

export const metadata = {
  title: "New Opportunity | Sales | Synplix Teams",
};

export default async function NewOpportunityPage() {
  const profile = await requirePermission(Permission.SALES_MANAGE);

  const [leadsResult, teamMembers] = await Promise.all([
    getLeads({ limit: 100 }, profile),
    getTeamMembers(),
  ]);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-semibold">New Opportunity</h1>
      <OpportunityForm
        leads={leadsResult.data}
        teamMembers={teamMembers}
        action={createOpportunityAction}
      />
    </div>
  );
}
