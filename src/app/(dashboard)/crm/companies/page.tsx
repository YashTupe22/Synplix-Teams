import { requirePermission, Permission } from "@/lib/authorization-server";
import { getCompanies } from "@/services/crm";
import { PageHeader } from "@/components/page-header";
import { CompanyList } from "@/components/crm/company-list";

export const metadata = { title: "Companies | CRM | Synplix Teams" };

export default async function CompaniesPage() {
  const profile = await requirePermission(Permission.CRM_VIEW);
  const data = await getCompanies({ page: 1, limit: 20 });

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Companies" description="Manage your business contacts" />
      <CompanyList
        initialData={data}
        isAdmin={profile.role === "admin"}
        isManager={profile.role === "manager"}
      />
    </div>
  );
}
