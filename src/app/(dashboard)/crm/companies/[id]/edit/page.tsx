import { notFound } from "next/navigation";
import { requirePermission, Permission } from "@/lib/authorization-server";
import { getCompanyById } from "@/services/crm";
import { updateCompanyAction } from "../../actions";
import { CompanyForm } from "@/components/crm/company-form";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const company = await getCompanyById(id);
  return { title: company ? `Edit ${company.name}` : "Edit Company" };
}

export default async function EditCompanyPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission(Permission.CRM_MANAGE);
  const { id } = await params;
  const company = await getCompanyById(id);
  if (!company) notFound();

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-semibold">Edit Company</h1>
      <CompanyForm company={company} action={updateCompanyAction} />
    </div>
  );
}
