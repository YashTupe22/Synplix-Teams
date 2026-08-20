import { Metadata } from "next";
import { requirePermission, Permission } from "@/lib/authorization-server";
import { PageHeader } from "@/components/page-header";
import { ExpenseForm } from "@/components/finance/expense-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "New Expense | Synplix Teams",
};

export default async function NewExpensePage() {
  await requirePermission(Permission.FINANCE_MANAGE);
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, project_code")
    .in("status", ["planning", "active"])
    .order("project_code");

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="New Expense"
        description="Record a new expense"
      />
      <ExpenseForm projects={projects || []} />
    </div>
  );
}
