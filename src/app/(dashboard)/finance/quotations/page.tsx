import { Metadata } from "next";
import { requirePermission, Permission } from "@/lib/authorization-server";
import { getQuotations } from "@/services/finance";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { QUOTATION_STATUS_CONFIG, QuotationStatus } from "@/types/finance";
import { FileText, Plus, Search } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Quotations | Synplix Teams",
};

export default async function QuotationsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  await requirePermission(Permission.FINANCE_VIEW);
  const params = await searchParams;

  const result = await getQuotations({
    search: params.search,
    status: params.status ? (params.status.split(",") as QuotationStatus[]) : undefined,
    page: params.page ? parseInt(params.page) : 1,
    limit: 20,
  }).catch(() => ({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 }));

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Quotations"
        description={`${result.total} total quotations`}
      >
        <Link
          href="/finance/quotations/new"
          className={buttonVariants({ size: "sm" })}
        >
          <Plus className="mr-1.5 size-3.5" />
          New Quotation
        </Link>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search quotations..."
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
          {(Object.entries(QUOTATION_STATUS_CONFIG) as [QuotationStatus, { label: string }][]).map(
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
          <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium">No quotations</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Get started by creating a new quotation.
          </p>
          <Link
            href="/finance/quotations/new"
            className={buttonVariants({ size: "sm" })}
          >
            <Plus className="mr-1.5 size-3.5" />
            New Quotation
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {result.data.map((q) => {
            const statusCfg = QUOTATION_STATUS_CONFIG[q.status];
            return (
              <Link key={q.id} href={`/finance/quotations/${q.id}`} className="group block">
                <div className="rounded-lg border border-border p-4 transition-colors group-hover:bg-muted/50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{q.quotation_number}</p>
                        <Badge variant="outline" className={`text-[10px] ${statusCfg.color}`}>
                          {statusCfg.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {q.client?.company?.name || q.client?.client_code}
                        {q.project && ` · ${q.project.name}`}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Date: {new Date(q.quotation_date).toLocaleDateString("en-IN")}</span>
                        {q.valid_until && (
                          <span>Valid until: {new Date(q.valid_until).toLocaleDateString("en-IN")}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">₹{q.total_amount.toLocaleString("en-IN")}</p>
                      <p className="text-xs text-muted-foreground">
                        {q.items?.length || 0} item{(q.items?.length || 0) !== 1 ? "s" : ""}
                      </p>
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
              href={`/finance/quotations?page=${page}`}
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
