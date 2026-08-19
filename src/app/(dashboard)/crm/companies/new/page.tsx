import { requirePermission, Permission } from "@/lib/authorization-server";
import { createCompanyAction } from "../actions";
import { CompanyForm } from "@/components/crm/company-form";

export const metadata = { title: "New Company | CRM | Synplix Teams" };

export default async function NewCompanyPage() {
  await requirePermission(Permission.CRM_MANAGE);
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-semibold">New Company</h1>
      <CompanyForm action={createCompanyAction} />
    </div>
  );
}
