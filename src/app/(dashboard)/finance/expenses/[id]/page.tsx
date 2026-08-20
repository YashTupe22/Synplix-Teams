import { notFound } from "next/navigation";
import { requirePermission, Permission } from "@/lib/authorization-server";
import { getExpenseById } from "@/services/finance";
import { cancelExpenseAction } from "@/app/(dashboard)/finance/actions";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { EXPENSE_CATEGORY_CONFIG, EXPENSE_STATUS_CONFIG, formatCurrency } from "@/types/finance";
import { Receipt, Calendar, User, FolderKanban, Tag } from "lucide-react";
import Link from "next/link";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const expense = await getExpenseById(id);
  return { title: expense ? `${expense.title} | Expenses` : "Expense | Synplix Teams" };
}

export default async function ExpenseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requirePermission(Permission.FINANCE_VIEW);
  const { id } = await params;

  async function handleCancelExpense(expenseId: string) {
    "use server";
    await cancelExpenseAction(expenseId);
  }

  const expense = await getExpenseById(id);
  if (!expense) notFound();

  const statusCfg = EXPENSE_STATUS_CONFIG[expense.status];

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title={expense.title}
        description={EXPENSE_CATEGORY_CONFIG[expense.category]?.label}
      >
        <div className="flex items-center gap-2">
          {expense.status === "recorded" && (
            <Link
              href={`/finance/expenses/${id}/edit`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Edit
            </Link>
          )}
          {expense.status === "recorded" && (
            <form action={handleCancelExpense.bind(null, id)}>
              <button type="submit" className={buttonVariants({ variant: "outline", size: "sm", className: "text-destructive" })}>
                Cancel Expense
              </button>
            </form>
          )}
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Expense Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Receipt className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Title</p>
                    <p className="text-sm text-muted-foreground">{expense.title}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Status</p>
                  <Badge variant="outline" className={statusCfg.color}>{statusCfg.label}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Category</p>
                    <p className="text-sm text-muted-foreground">{EXPENSE_CATEGORY_CONFIG[expense.category]?.label}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Date</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(expense.expense_date).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                </div>
                {expense.project && (
                  <div className="flex items-center gap-2">
                    <FolderKanban className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Project</p>
                      <Link href={`/projects/${expense.project.id}`} className="text-sm text-muted-foreground hover:underline">
                        {expense.project.project_code} - {expense.project.name}
                      </Link>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <User className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Created By</p>
                    <p className="text-sm text-muted-foreground">
                      {expense.creator?.full_name || expense.creator?.email}
                    </p>
                  </div>
                </div>
              </div>

              {expense.description && (
                <div>
                  <p className="text-sm font-medium mb-1">Description</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{expense.description}</p>
                </div>
              )}

              {expense.notes && (
                <div>
                  <p className="text-sm font-medium mb-1">Notes</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{expense.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{formatCurrency(expense.amount)}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
