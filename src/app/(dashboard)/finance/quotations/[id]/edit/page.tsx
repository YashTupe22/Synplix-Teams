import { notFound } from "next/navigation";
import { requirePermission, Permission } from "@/lib/authorization-server";
import { getQuotationById } from "@/services/finance";
import { PageHeader } from "@/components/page-header";
import { QuotationForm } from "@/components/finance/quotation-form";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quotation = await getQuotationById(id);
  return { title: quotation ? `Edit ${quotation.quotation_number} | Quotations` : "Edit Quotation | Synplix Teams" };
}

export default async function EditQuotationPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission(Permission.FINANCE_MANAGE);
  const { id } = await params;

  const quotation = await getQuotationById(id);
  if (!quotation) notFound();

  const supabase = await createClient();

  const [clientsRes, projectsRes] = await Promise.all([
    supabase
      .from("clients")
      .select("id, client_code, company:companies(name)")
      .order("client_code"),
    supabase
      .from("projects")
      .select("id, name, project_code")
      .order("project_code"),
  ]);

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title={`Edit ${quotation.quotation_number}`}
        description="Update quotation details"
      />
      <QuotationForm
        quotation={quotation}
        clients={(clientsRes.data || []).map((c) => ({ ...c, company: Array.isArray(c.company) ? c.company[0] : c.company }))}
        projects={projectsRes.data || []}
      />
    </div>
  );
}
