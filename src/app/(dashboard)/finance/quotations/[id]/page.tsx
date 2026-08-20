import { notFound } from "next/navigation";
import { requirePermission, Permission } from "@/lib/authorization-server";
import { getQuotationById } from "@/services/finance";
import { updateQuotationStatusAction, createInvoiceFromQuotationAction } from "@/app/(dashboard)/finance/actions";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { QUOTATION_STATUS_CONFIG, formatCurrency } from "@/types/finance";
import { FileText, Calendar, User, FolderKanban, ArrowRight } from "lucide-react";
import Link from "next/link";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quotation = await getQuotationById(id);
  return { title: quotation ? `${quotation.quotation_number} | Quotations` : "Quotation | Synplix Teams" };
}

export default async function QuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requirePermission(Permission.FINANCE_VIEW);
  const { id } = await params;

  async function handleUpdateQuotationStatus(quotationId: string, status: string) {
    "use server";
    await updateQuotationStatusAction(quotationId, status);
  }

  async function handleCreateInvoice(quotationId: string) {
    "use server";
    await createInvoiceFromQuotationAction(quotationId);
  }

  const quotation = await getQuotationById(id);
  if (!quotation) notFound();

  const statusCfg = QUOTATION_STATUS_CONFIG[quotation.status];
  const canCreateInvoice = quotation.status === "accepted";

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title={quotation.quotation_number}
        description={quotation.client?.company?.name || quotation.client?.client_code}
      >
        <div className="flex items-center gap-2">
          {canCreateInvoice && (
            <form action={handleCreateInvoice.bind(null, id)}>
              <button
                type="submit"
                className={buttonVariants({ size: "sm" })}
              >
                <ArrowRight className="mr-1.5 size-3.5" />
                Create Invoice
              </button>
            </form>
          )}
          <Link
            href={`/finance/quotations/${id}/edit`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Edit
          </Link>
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Quotation Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quotation Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Number</p>
                    <p className="text-sm text-muted-foreground">{quotation.quotation_number}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Status</p>
                  <Badge variant="outline" className={statusCfg.color}>{statusCfg.label}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Date</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(quotation.quotation_date).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                </div>
                {quotation.valid_until && (
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Valid Until</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(quotation.valid_until).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <User className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Created By</p>
                    <p className="text-sm text-muted-foreground">
                      {quotation.creator?.full_name || quotation.creator?.email}
                    </p>
                  </div>
                </div>
                {quotation.project && (
                  <div className="flex items-center gap-2">
                    <FolderKanban className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Project</p>
                      <Link href={`/projects/${quotation.project.id}`} className="text-sm text-muted-foreground hover:underline">
                        {quotation.project.project_code} - {quotation.project.name}
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {quotation.notes && (
                <div>
                  <p className="text-sm font-medium mb-1">Notes</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{quotation.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Line Items</CardTitle>
            </CardHeader>
            <CardContent>
              {(!quotation.items || quotation.items.length === 0) ? (
                <p className="text-sm text-muted-foreground">No items.</p>
              ) : (
                <div className="space-y-3">
                  <div className="hidden sm:grid sm:grid-cols-[1fr_80px_100px_100px_110px] gap-2 text-xs font-medium text-muted-foreground border-b pb-2">
                    <span>Description</span>
                    <span>Qty</span>
                    <span>Unit Price</span>
                    <span>Tax %</span>
                    <span className="text-right">Total</span>
                  </div>
                  {quotation.items.map((item) => (
                    <div key={item.id} className="grid grid-cols-1 sm:grid-cols-[1fr_80px_100px_100px_110px] gap-2 items-center text-sm">
                      <span>{item.description}</span>
                      <span>{item.quantity}</span>
                      <span>₹{item.unit_price.toLocaleString("en-IN")}</span>
                      <span>{item.tax_rate}%</span>
                      <span className="text-right font-medium">{formatCurrency(item.line_total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Totals */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(quotation.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span>-{formatCurrency(quotation.discount_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatCurrency(quotation.tax_amount)}</span>
              </div>
              <div className="flex justify-between font-medium border-t pt-2">
                <span>Total</span>
                <span>{formatCurrency(quotation.total_amount)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quotation.status === "draft" && (
                <form action={handleUpdateQuotationStatus.bind(null, id, "sent")}>
                  <button type="submit" className={buttonVariants({ variant: "outline", size: "sm", className: "w-full" })}>
                    Mark as Sent
                  </button>
                </form>
              )}
              {quotation.status === "sent" && (
                <>
                  <form action={handleUpdateQuotationStatus.bind(null, id, "accepted")}>
                    <button type="submit" className={buttonVariants({ variant: "outline", size: "sm", className: "w-full" })}>
                      Accept Quotation
                    </button>
                  </form>
                  <form action={handleUpdateQuotationStatus.bind(null, id, "rejected")}>
                    <button type="submit" className={buttonVariants({ variant: "outline", size: "sm", className: "w-full text-destructive" })}>
                      Reject Quotation
                    </button>
                  </form>
                </>
              )}
              {quotation.status !== "cancelled" && quotation.status !== "accepted" && quotation.status !== "rejected" && (
                <form action={handleUpdateQuotationStatus.bind(null, id, "cancelled")}>
                  <button type="submit" className={buttonVariants({ variant: "outline", size: "sm", className: "w-full text-destructive" })}>
                    Cancel Quotation
                  </button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
