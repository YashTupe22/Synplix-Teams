import { Metadata } from "next";
import { requirePermission, Permission } from "@/lib/authorization-server";
import { getInvoices } from "@/services/finance";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { INVOICE_STATUS_CONFIG, InvoiceStatus, formatCurrency } from "@/types/finance";
import { Receipt, Plus, Search } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Invoices | Synplix Teams",
};

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  await requirePermission(Permission.FINANCE_VIEW);
  const params = await searchParams;

  const result = await getInvoices({
    search: params.search,
    status: params.status ? (params.status.split(",") as InvoiceStatus[]) : undefined,
    page: params.page ? parseInt(params.page) : 1,
    limit: 20,
  }).catch(() => ({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 }));

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Invoices"
        description={`${result.total} total invoices`}
      >
        <Link
          href="/finance/invoices/new"
          className={buttonVariants({ size: "sm" })}
        >
          <Plus className="mr-1.5 size-3.5" />
          New Invoice
        </Link>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search invoices..."
            defaultValue={params.search}
            className="pl-9 pr-4 py-2 rounded-lg border border-border bg-background text-sm w-64"
            name="search"
          />
        </div>
        <select
          defaultValue={params.status || ""}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          name="status"
        >
          <option value="">All Status</option>
          {(Object.entries(INVOICE_STATUS_CONFIG) as [InvoiceStatus, { label: string }][]).map(
            ([value, config]) => (
              <option key={value} value={value}>
                {config.label}
              </option>
            )
          )}
        </select>
      </div>

      {/* List */}
      {result.data.length === 0 ? (
        <div className="text-center py-12">
          <Receipt className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium">No invoices</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Get started by creating a new invoice.
          </p>
          <Link
            href="/finance/invoices/new"
            className={buttonVariants({ size: "sm" })}
          >
            <Plus className="mr-1.5 size-3.5" />
            New Invoice
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {result.data.map((inv) => {
            const statusCfg = INVOICE_STATUS_CONFIG[inv.status];
            return (
              <Link key={inv.id} href={`/finance/invoices/${inv.id}`} className="group block">
                <div className="rounded-lg border border-border p-4 transition-colors group-hover:bg-muted/50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{inv.invoice_number}</p>
                        <Badge variant="outline" className={`text-[10px] ${statusCfg.color}`}>
                          {statusCfg.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {inv.client?.company?.name || inv.client?.client_code}
                        {inv.project && ` · ${inv.project.name}`}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Date: {new Date(inv.invoice_date).toLocaleDateString("en-IN")}</span>
                        {inv.due_date && (
                          <span>Due: {new Date(inv.due_date).toLocaleDateString("en-IN")}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{formatCurrency(inv.total_amount)}</p>
                      <p className="text-xs text-muted-foreground">
                        Paid: {formatCurrency(inv.amount_paid)}
                      </p>
                      {inv.balance_due > 0 && (
                        <p className="text-xs text-yellow-600">
                          Balance: {formatCurrency(inv.balance_due)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {result.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: result.totalPages }, (_, i) => i + 1).map((page) => (
            <Link
              key={page}
              href={`/finance/invoices?page=${page}`}
              className={buttonVariants({
                variant: page === result.page ? "default" : "outline",
                size: "sm",
              })}
            >
              {page}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
