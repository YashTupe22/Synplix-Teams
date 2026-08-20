import { notFound } from "next/navigation";
import { requirePermission, Permission } from "@/lib/authorization-server";
import { getInvoiceById } from "@/services/finance";
import { PageHeader } from "@/components/page-header";
import { InvoiceForm } from "@/components/finance/invoice-form";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await getInvoiceById(id);
  return { title: invoice ? `Edit ${invoice.invoice_number} | Invoices` : "Edit Invoice | Synplix Teams" };
}

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission(Permission.FINANCE_MANAGE);
  const { id } = await params;

  const invoice = await getInvoiceById(id);
  if (!invoice) notFound();

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
        title={`Edit ${invoice.invoice_number}`}
        description="Update invoice details"
      />
      <InvoiceForm
        invoice={invoice}
        clients={(clientsRes.data || []).map((c) => ({ ...c, company: Array.isArray(c.company) ? c.company[0] : c.company }))}
        projects={projectsRes.data || []}
      />
    </div>
  );
}
