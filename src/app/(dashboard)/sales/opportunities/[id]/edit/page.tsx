import { requirePermission, Permission } from "@/lib/authorization-server";
import { getOpportunityById, getTeamMembers } from "@/services/sales";
import { getLeads } from "@/services/crm";
import { updateOpportunityAction } from "../../../actions";
import { OpportunityForm } from "@/components/sales/opportunity-form";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Edit Opportunity | Sales | Synplix Teams",
};

export default async function EditOpportunityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requirePermission(Permission.SALES_MANAGE);
  const { id } = await params;
  const opp = await getOpportunityById(id);

  if (!opp) notFound();

  const [leadsResult, teamMembers] = await Promise.all([
    getLeads({ limit: 100 }, profile),
    getTeamMembers(),
  ]);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-semibold">Edit Opportunity</h1>
      <OpportunityForm
        opportunity={opp}
        leads={leadsResult.data}
        teamMembers={teamMembers}
        action={updateOpportunityAction}
      />
    </div>
  );
}
