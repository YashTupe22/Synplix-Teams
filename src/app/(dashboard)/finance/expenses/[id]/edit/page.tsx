import { notFound } from "next/navigation";
import { requirePermission, Permission } from "@/lib/authorization-server";
import { getExpenseById } from "@/services/finance";
import { PageHeader } from "@/components/page-header";
import { ExpenseForm } from "@/components/finance/expense-form";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const expense = await getExpenseById(id);
  return { title: expense ? `Edit ${expense.title} | Expenses` : "Edit Expense | Synplix Teams" };
}

export default async function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission(Permission.FINANCE_MANAGE);
  const { id } = await params;

  const expense = await getExpenseById(id);
  if (!expense) notFound();

  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, project_code")
    .order("project_code");

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title={`Edit ${expense.title}`}
        description="Update expense details"
      />
      <ExpenseForm
        expense={expense}
        projects={projects || []}
      />
    </div>
  );
}
