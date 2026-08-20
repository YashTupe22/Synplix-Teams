import { Metadata } from "next";
import { requirePermission, Permission } from "@/lib/authorization-server";
import { getFinanceMetrics, getQuotations, getInvoices, getPayments, getExpenses } from "@/services/finance";
import { PageHeader } from "@/components/page-header";
import { FinanceMetricsCards, FinanceSummaryCards } from "@/components/finance/finance-metrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { QUOTATION_STATUS_CONFIG, INVOICE_STATUS_CONFIG } from "@/types/finance";
import { FileText, Receipt, CreditCard, TrendingUp, Plus } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Finance | Synplix Teams",
};

export default async function FinancePage() {
  const profile = await requirePermission(Permission.FINANCE_VIEW);

  const [metrics, quotationsResult, invoicesResult, paymentsResult, expensesResult] = await Promise.all([
    getFinanceMetrics().catch(() => ({
      revenueThisMonth: 0,
      outstanding: 0,
      overdue: 0,
      paymentsReceived: 0,
      expensesThisMonth: 0,
      netCashMovement: 0,
      quotationValue: 0,
      acceptedQuotations: 0,
      invoiceValue: 0,
      paidInvoiceValue: 0,
    })),
    getQuotations({ limit: 5 }).catch(() => ({ data: [], total: 0, page: 1, limit: 5, totalPages: 0 })),
    getInvoices({ limit: 5 }).catch(() => ({ data: [], total: 0, page: 1, limit: 5, totalPages: 0 })),
    getPayments({ limit: 5 }).catch(() => ({ data: [], total: 0, page: 1, limit: 5, totalPages: 0 })),
    getExpenses({ limit: 5 }).catch(() => ({ data: [], total: 0, page: 1, limit: 5, totalPages: 0 })),
  ]);

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Finance"
        description="Track quotations, invoices, payments, and expenses"
      >
        <div className="flex items-center gap-2">
          <Link
            href="/finance/quotations/new"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Plus className="mr-1.5 size-3.5" />
            Quotation
          </Link>
          <Link
            href="/finance/invoices/new"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Plus className="mr-1.5 size-3.5" />
            Invoice
          </Link>
          <Link
            href="/finance/expenses/new"
            className={buttonVariants({ size: "sm" })}
          >
            <Plus className="mr-1.5 size-3.5" />
            Expense
          </Link>
        </div>
      </PageHeader>

      <FinanceMetricsCards metrics={metrics} />
      <FinanceSummaryCards metrics={metrics} />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Quotations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="size-4" />
              Recent Quotations
            </CardTitle>
            <Link
              href="/finance/quotations"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              View All
            </Link>
          </CardHeader>
          <CardContent>
            {quotationsResult.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">No quotations yet.</p>
            ) : (
              <div className="space-y-3">
                {quotationsResult.data.map((q) => {
                  const statusCfg = QUOTATION_STATUS_CONFIG[q.status];
                  return (
                    <Link key={q.id} href={`/finance/quotations/${q.id}`} className="group block">
                      <div className="rounded-lg border border-border p-3 transition-colors group-hover:bg-muted/50">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium">{q.quotation_number}</p>
                            <p className="text-xs text-muted-foreground">
                              {q.client?.company?.name || q.client?.client_code}
                            </p>
                          </div>
                          <Badge variant="outline" className={`shrink-0 text-[10px] ${statusCfg.color}`}>
                            {statusCfg.label}
                          </Badge>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                          <span>{new Date(q.quotation_date).toLocaleDateString("en-IN")}</span>
                          <span className="font-medium">₹{q.total_amount.toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="size-4" />
              Recent Invoices
            </CardTitle>
            <Link
              href="/finance/invoices"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              View All
            </Link>
          </CardHeader>
          <CardContent>
            {invoicesResult.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">No invoices yet.</p>
            ) : (
              <div className="space-y-3">
                {invoicesResult.data.map((inv) => {
                  const statusCfg = INVOICE_STATUS_CONFIG[inv.status];
                  return (
                    <Link key={inv.id} href={`/finance/invoices/${inv.id}`} className="group block">
                      <div className="rounded-lg border border-border p-3 transition-colors group-hover:bg-muted/50">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium">{inv.invoice_number}</p>
                            <p className="text-xs text-muted-foreground">
                              {inv.client?.company?.name || inv.client?.client_code}
                            </p>
                          </div>
                          <Badge variant="outline" className={`shrink-0 text-[10px] ${statusCfg.color}`}>
                            {statusCfg.label}
                          </Badge>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                          <span>₹{inv.amount_paid.toLocaleString("en-IN")} / ₹{inv.total_amount.toLocaleString("en-IN")}</span>
                          {inv.due_date && (
                            <span>Due {new Date(inv.due_date).toLocaleDateString("en-IN")}</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="size-4" />
              Recent Payments
            </CardTitle>
            <Link
              href="/finance/payments"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              View All
            </Link>
          </CardHeader>
          <CardContent>
            {paymentsResult.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {paymentsResult.data.map((p) => (
                  <div key={p.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">₹{p.amount.toLocaleString("en-IN")}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.invoice?.invoice_number} · {p.payment_method}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(p.payment_date).toLocaleDateString("en-IN")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Expenses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="size-4" />
              Recent Expenses
            </CardTitle>
            <Link
              href="/finance/expenses"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              View All
            </Link>
          </CardHeader>
          <CardContent>
            {expensesResult.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">No expenses recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {expensesResult.data.map((e) => (
                  <div key={e.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{e.title}</p>
                        <p className="text-xs text-muted-foreground">{e.category}</p>
                      </div>
                      <span className="text-sm font-medium">₹{e.amount.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {new Date(e.expense_date).toLocaleDateString("en-IN")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
