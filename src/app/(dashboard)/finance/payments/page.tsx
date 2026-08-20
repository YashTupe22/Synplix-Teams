import { Metadata } from "next";
import { requirePermission, Permission } from "@/lib/authorization-server";
import { getPayments } from "@/services/finance";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { PAYMENT_METHOD_CONFIG, PaymentMethod, formatCurrency } from "@/types/finance";
import { CreditCard, Plus, Search } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Payments | Synplix Teams",
};

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  await requirePermission(Permission.FINANCE_VIEW);
  const params = await searchParams;

  const result = await getPayments({
    payment_method: params.method ? (params.method.split(",") as PaymentMethod[]) : undefined,
    date_from: params.date_from,
    date_to: params.date_to,
    page: params.page ? parseInt(params.page) : 1,
    limit: 20,
  }).catch(() => ({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 }));

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Payments"
        description={`${result.total} total payments`}
      >
        <Link
          href="/finance/payments/new"
          className={buttonVariants({ size: "sm" })}
        >
          <Plus className="mr-1.5 size-3.5" />
          Record Payment
        </Link>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="date"
            defaultValue={params.date_from}
            className="pl-9 pr-4 py-2 rounded-lg border border-border bg-background text-sm"
            name="date_from"
            placeholder="From date"
          />
        </div>
        <input
          type="date"
          defaultValue={params.date_to}
          className="px-4 py-2 rounded-lg border border-border bg-background text-sm"
          name="date_to"
          placeholder="To date"
        />
        <select
          defaultValue={params.method || ""}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          name="method"
        >
          <option value="">All Methods</option>
          {(Object.entries(PAYMENT_METHOD_CONFIG) as [PaymentMethod, { label: string }][]).map(
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
          <CreditCard className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium">No payments</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Get started by recording a payment.
          </p>
          <Link
            href="/finance/payments/new"
            className={buttonVariants({ size: "sm" })}
          >
            <Plus className="mr-1.5 size-3.5" />
            Record Payment
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {result.data.map((p) => (
            <div key={p.id} className="rounded-lg border border-border p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{formatCurrency(p.amount)}</p>
                    <span className="text-xs text-muted-foreground">
                      {PAYMENT_METHOD_CONFIG[p.payment_method]?.label}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Invoice: {p.invoice?.invoice_number}
                    {p.reference_number && ` · Ref: ${p.reference_number}`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Recorded by: {p.recorder?.full_name || p.recorder?.email}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    {new Date(p.payment_date).toLocaleDateString("en-IN")}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {result.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: result.totalPages }, (_, i) => i + 1).map((page) => (
            <Link
              key={page}
              href={`/finance/payments?page=${page}`}
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
