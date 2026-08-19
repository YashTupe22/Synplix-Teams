import { requirePermission, Permission } from "@/lib/authorization-server";
import { getLeads } from "@/services/crm";
import { PageHeader } from "@/components/page-header";
import { LeadsTable } from "@/components/crm/leads-table";

export const metadata = {
  title: "Leads | CRM | Synplix Teams",
};

export default async function LeadsPage() {
  const profile = await requirePermission(Permission.CRM_VIEW);
  const data = await getLeads({ page: 1, limit: 20 }, profile);

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Leads"
        description="Manage your sales pipeline"
      />
      <LeadsTable
        initialData={data}
        isAdmin={profile.role === "admin"}
        isManager={profile.role === "manager"}
      />
    </div>
  );
}
