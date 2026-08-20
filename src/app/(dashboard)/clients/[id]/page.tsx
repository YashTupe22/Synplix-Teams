import { notFound } from "next/navigation";
import { requirePermission, Permission } from "@/lib/authorization-server";
import { getClientById, getClientNotes } from "@/services/clients";
import { getProjects } from "@/services/projects";
import { getClientBilling } from "@/services/finance";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { CLIENT_STATUS_CONFIG } from "@/types/clients";
import { PROJECT_STATUS_CONFIG } from "@/types/clients";
import { QUOTATION_STATUS_CONFIG, INVOICE_STATUS_CONFIG, formatCurrency, InvoiceStatus, QuotationStatus } from "@/types/finance";
import { DocumentSection } from "@/components/documents/document-section";
import { Building2, User, Calendar, FileText, FolderKanban, Plus, Receipt, CreditCard } from "lucide-react";
import Link from "next/link";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await getClientById(id);
  return { title: client ? `${client.client_code} | Clients` : "Client | Synplix Teams" };
}

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requirePermission(Permission.CLIENTS_VIEW);
  const { id } = await params;

  const client = await getClientById(id);
  if (!client) notFound();

  type BillingInvoice = { id: string; invoice_number: string; status: InvoiceStatus; total_amount: number; amount_paid: number; balance_due: number; invoice_date: string; due_date: string | null };
  type BillingQuotation = { id: string; quotation_number: string; status: QuotationStatus; total_amount: number; quotation_date: string };
  type BillingResult = { quotations: BillingQuotation[]; invoices: BillingInvoice[]; totalInvoiced: number; totalPaid: number; outstanding: number; overdue: number };

  const [projectsResult, notesResult, billingResultRaw] = await Promise.all([
    getProjects({ client_id: id, limit: 100 }, profile).catch(() => ({ data: [], total: 0, page: 1, limit: 100, totalPages: 0 })),
    getClientNotes(id, 1, 10).catch(() => ({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 })),
    getClientBilling(id).catch((): BillingResult => ({ quotations: [], invoices: [], totalInvoiced: 0, totalPaid: 0, outstanding: 0, overdue: 0 })),
  ]);

  const billingResult = billingResultRaw as BillingResult;

  const statusCfg = CLIENT_STATUS_CONFIG[client.status];

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title={client.client_code}
        description={client.company?.name ?? "No company"}
      >
        <div className="flex items-center gap-2">
          <Link
            href={`/clients/${id}/edit`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Edit
          </Link>
          <Link
            href={`/projects/new?client_id=${id}`}
            className={buttonVariants({ size: "sm" })}
          >
            <Plus className="mr-1.5 size-3.5" />
            Create Project
          </Link>
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Client Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Building2 className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Company</p>
                    <p className="text-sm text-muted-foreground">{client.company?.name ?? "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <User className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Primary Contact</p>
                    <p className="text-sm text-muted-foreground">
                      {client.primary_contact
                        ? `${client.primary_contact.first_name} ${client.primary_contact.last_name ?? ""}`
                        : "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <User className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Account Manager</p>
                    <p className="text-sm text-muted-foreground">
                      {client.account_manager?.full_name ?? "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Converted</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(client.converted_at).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <Badge variant="outline" className={statusCfg.color}>{statusCfg.label}</Badge>
              </div>
              {client.notes && (
                <div>
                  <p className="text-sm font-medium mb-1">Notes</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{client.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FolderKanban className="size-4" />
                Projects ({projectsResult.data.length})
              </CardTitle>
              <Link
                href={`/projects/new?client_id=${id}`}
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                <Plus className="mr-1 size-3" /> Create
              </Link>
            </CardHeader>
            <CardContent>
              {projectsResult.data.length === 0 ? (
                <p className="text-sm text-muted-foreground">No projects yet.</p>
              ) : (
                <div className="space-y-3">
                  {projectsResult.data.map((project) => {
                    const projStatusCfg = PROJECT_STATUS_CONFIG[project.status];
                    return (
                      <Link key={project.id} href={`/projects/${project.id}`} className="group block">
                        <div className="rounded-lg border border-border p-3 transition-colors group-hover:bg-muted/50">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium">{project.name}</p>
                              <p className="text-xs text-muted-foreground">{project.project_code}</p>
                            </div>
                            <Badge variant="outline" className={`shrink-0 text-[10px] ${projStatusCfg.color}`}>
                              {projStatusCfg.label}
                            </Badge>
                          </div>
                          <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{project.progress_percent}% complete</span>
                            {project.target_end_date && (
                              <span>Due {new Date(project.target_end_date).toLocaleDateString("en-IN")}</span>
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
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="size-4" />
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {notesResult.data.length === 0 ? (
                <p className="text-sm text-muted-foreground">No notes yet.</p>
              ) : (
                <div className="space-y-3">
                  {notesResult.data.map((note) => (
                    <div key={note.id} className="rounded-lg border border-border p-3">
                      <p className="text-sm">{note.content}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {note.user?.full_name ?? note.user?.email} ·{" "}
                        {new Date(note.created_at).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Conversion Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Converted by</span>
                <span>{client.converted_by_user?.full_name ?? "—"}</span>
              </div>
              {client.lead && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Source lead</span>
                  <span>{client.lead.title}</span>
                </div>
              )}
              {client.opportunity && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Opportunity</span>
                  <span>{client.opportunity.title}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Billing Summary */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="size-4" />
                Billing
              </CardTitle>
              <Link
                href={`/finance/quotations/new?client_id=${id}`}
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                <Plus className="mr-1 size-3" /> New
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Total Invoiced</p>
                  <p className="text-lg font-bold">{formatCurrency(billingResult.totalInvoiced)}</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Total Paid</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(billingResult.totalPaid)}</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Outstanding</p>
                  <p className="text-lg font-bold text-yellow-600">{formatCurrency(billingResult.outstanding)}</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Overdue</p>
                  <p className="text-lg font-bold text-red-600">{formatCurrency(billingResult.overdue)}</p>
                </div>
              </div>

              {/* Recent Invoices */}
              <div>
                <p className="text-sm font-medium mb-2">Recent Invoices</p>
                {billingResult.invoices.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No invoices yet.</p>
                ) : (
                  <div className="space-y-2">
                    {billingResult.invoices.slice(0, 3).map((inv) => (
                      <Link key={inv.id} href={`/finance/invoices/${inv.id}`} className="block">
                        <div className="flex items-center justify-between rounded-lg border border-border p-2 text-xs hover:bg-muted/50">
                          <div>
                            <span className="font-medium">{inv.invoice_number}</span>
                            <Badge variant="outline" className={`ml-2 text-[9px] ${INVOICE_STATUS_CONFIG[inv.status]?.color}`}>
                              {INVOICE_STATUS_CONFIG[inv.status]?.label}
                            </Badge>
                          </div>
                          <span>{formatCurrency(inv.total_amount)}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Quotations */}
              <div>
                <p className="text-sm font-medium mb-2">Recent Quotations</p>
                {billingResult.quotations.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No quotations yet.</p>
                ) : (
                  <div className="space-y-2">
                    {billingResult.quotations.slice(0, 3).map((q) => (
                      <Link key={q.id} href={`/finance/quotations/${q.id}`} className="block">
                        <div className="flex items-center justify-between rounded-lg border border-border p-2 text-xs hover:bg-muted/50">
                          <div>
                            <span className="font-medium">{q.quotation_number}</span>
                            <Badge variant="outline" className={`ml-2 text-[9px] ${QUOTATION_STATUS_CONFIG[q.status]?.color}`}>
                              {QUOTATION_STATUS_CONFIG[q.status]?.label}
                            </Badge>
                          </div>
                          <span>{formatCurrency(q.total_amount)}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <DocumentSection entityType="client" entityId={id} />
        </div>
      </div>
    </div>
  );
}
