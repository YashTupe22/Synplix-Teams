import { notFound } from "next/navigation";
import { requirePermission, Permission } from "@/lib/authorization-server";
import { getInvoiceById } from "@/services/finance";
import { updateInvoiceStatusAction } from "@/app/(dashboard)/finance/actions";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { INVOICE_STATUS_CONFIG, PAYMENT_METHOD_CONFIG, formatCurrency, PaymentWithRelations } from "@/types/finance";
import { DocumentSection } from "@/components/documents/document-section";
import { Receipt, Calendar, User, FolderKanban, CreditCard, Plus } from "lucide-react";
import Link from "next/link";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await getInvoiceById(id);
  return { title: invoice ? `${invoice.invoice_number} | Invoices` : "Invoice | Synplix Teams" };
}

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requirePermission(Permission.FINANCE_VIEW);
  const { id } = await params;

  async function handleUpdateInvoiceStatus(invoiceId: string, status: string) {
    "use server";
    await updateInvoiceStatusAction(invoiceId, status);
  }

  const invoice = await getInvoiceById(id);
  if (!invoice) notFound();

  const statusCfg = INVOICE_STATUS_CONFIG[invoice.status];
  const canRecordPayment = invoice.status !== "paid" && invoice.status !== "cancelled";

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title={invoice.invoice_number}
        description={invoice.client?.company?.name || invoice.client?.client_code}
      >
        <div className="flex items-center gap-2">
          {canRecordPayment && (
            <Link
              href={`/finance/payments/new?invoice_id=${id}`}
              className={buttonVariants({ size: "sm" })}
            >
              <Plus className="mr-1.5 size-3.5" />
              Record Payment
            </Link>
          )}
          <Link
            href={`/finance/invoices/${id}/edit`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Edit
          </Link>
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Receipt className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Number</p>
                    <p className="text-sm text-muted-foreground">{invoice.invoice_number}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Status</p>
                  <Badge variant="outline" className={statusCfg.color}>{statusCfg.label}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Invoice Date</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(invoice.invoice_date).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                </div>
                {invoice.due_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Due Date</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(invoice.due_date).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <User className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Created By</p>
                    <p className="text-sm text-muted-foreground">
                      {invoice.creator?.full_name || invoice.creator?.email}
                    </p>
                  </div>
                </div>
                {invoice.project && (
                  <div className="flex items-center gap-2">
                    <FolderKanban className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Project</p>
                      <Link href={`/projects/${invoice.project.id}`} className="text-sm text-muted-foreground hover:underline">
                        {invoice.project.project_code} - {invoice.project.name}
                      </Link>
                    </div>
                  </div>
                )}
                {invoice.quotation && (
                  <div className="flex items-center gap-2">
                    <Receipt className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">From Quotation</p>
                      <Link href={`/finance/quotations/${invoice.quotation.id}`} className="text-sm text-muted-foreground hover:underline">
                        {invoice.quotation.quotation_number}
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {invoice.notes && (
                <div>
                  <p className="text-sm font-medium mb-1">Notes</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{invoice.notes}</p>
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
              {(!invoice.items || invoice.items.length === 0) ? (
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
                  {invoice.items.map((item) => (
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

          {/* Payment History */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="size-4" />
                Payment History
              </CardTitle>
              {canRecordPayment && (
                <Link
                  href={`/finance/payments/new?invoice_id=${id}`}
                  className={buttonVariants({ variant: "ghost", size: "sm" })}
                >
                  <Plus className="mr-1 size-3" /> Add Payment
                </Link>
              )}
            </CardHeader>
            <CardContent>
              {(!invoice.payments || invoice.payments.length === 0) ? (
                <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {invoice.payments.map((payment: PaymentWithRelations) => (
                    <div key={payment.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div className="flex items-center gap-3">
                        <CreditCard className="size-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{formatCurrency(payment.amount)}</p>
                          <p className="text-xs text-muted-foreground">
                            {PAYMENT_METHOD_CONFIG[payment.payment_method]?.label}
                            {payment.reference_number && ` · ${payment.reference_number}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {new Date(payment.payment_date).toLocaleDateString("en-IN")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          by {payment.recorder?.full_name || payment.recorder?.email}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span>-{formatCurrency(invoice.discount_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatCurrency(invoice.tax_amount)}</span>
              </div>
              <div className="flex justify-between font-medium border-t pt-2">
                <span>Total</span>
                <span>{formatCurrency(invoice.total_amount)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Paid</span>
                <span>{formatCurrency(invoice.amount_paid)}</span>
              </div>
              {invoice.balance_due > 0 && (
                <div className="flex justify-between font-medium text-yellow-600 border-t pt-2">
                  <span>Balance Due</span>
                  <span>{formatCurrency(invoice.balance_due)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {invoice.status === "draft" && (
                <form action={handleUpdateInvoiceStatus.bind(null, id, "sent")}>
                  <button type="submit" className={buttonVariants({ variant: "outline", size: "sm", className: "w-full" })}>
                    Mark as Sent
                  </button>
                </form>
              )}
              {invoice.status !== "cancelled" && invoice.status !== "paid" && (
                <form action={handleUpdateInvoiceStatus.bind(null, id, "cancelled")}>
                  <button type="submit" className={buttonVariants({ variant: "outline", size: "sm", className: "w-full text-destructive" })}>
                    Cancel Invoice
                  </button>
                </form>
              )}
            </CardContent>
          </Card>

          <DocumentSection entityType="invoice" entityId={id} />
        </div>
      </div>
    </div>
  );
}
