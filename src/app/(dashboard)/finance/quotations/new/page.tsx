import { Metadata } from "next";
import { requirePermission, Permission } from "@/lib/authorization-server";
import { PageHeader } from "@/components/page-header";
import { QuotationForm } from "@/components/finance/quotation-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "New Quotation | Synplix Teams",
};

export default async function NewQuotationPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  await requirePermission(Permission.FINANCE_MANAGE);
  const params = await searchParams;
  const supabase = await createClient();

  const [clientsRes, projectsRes] = await Promise.all([
    supabase
      .from("clients")
      .select("id, client_code, company:companies(name)")
      .eq("status", "active")
      .order("client_code"),
    supabase
      .from("projects")
      .select("id, name, project_code")
      .in("status", ["planning", "active"])
      .order("project_code"),
  ]);

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="New Quotation"
        description="Create a new quotation for a client"
      />
      <QuotationForm
        clients={(clientsRes.data || []).map((c) => ({ ...c, company: Array.isArray(c.company) ? c.company[0] : c.company }))}
        projects={projectsRes.data || []}
        defaultClientId={params.client_id}
        defaultProjectId={params.project_id}
      />
    </div>
  );
}
