import { notFound } from "next/navigation";
import { requirePermission, Permission } from "@/lib/authorization-server";
import { getCompanyWithRelations } from "@/services/crm";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { LEAD_STATUS_CONFIG } from "@/types/crm";
import { DocumentSection } from "@/components/documents/document-section";
import { Pencil, ExternalLink } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getCompanyWithRelations(id);
  return { title: result ? `${result.company.name} | Companies` : "Company | Synplix Teams" };
}

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requirePermission(Permission.CRM_VIEW);
  const { id } = await params;
  const result = await getCompanyWithRelations(id);

  if (!result) notFound();
  const { company, contacts, leads } = result;
  const isAdmin = profile.role === "admin";
  const isManager = profile.role === "manager";

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader title={company.name} description={company.industry ?? ""} />
        {(isAdmin || isManager) && (
          <Link href={`/crm/companies/${company.id}/edit`} className={buttonVariants({ size: "sm" })}>
            <Pencil className="mr-1.5 size-3.5" /> Edit
          </Link>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Company Details</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
              {company.website && (
                <div><span className="text-muted-foreground">Website: </span>
                  <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                    {company.website} <ExternalLink className="size-3" />
                  </a>
                </div>
              )}
              {company.email && <div><span className="text-muted-foreground">Email: </span>{company.email}</div>}
              {company.phone && <div><span className="text-muted-foreground">Phone: </span>{company.phone}</div>}
              {company.address && <div className="sm:col-span-2"><span className="text-muted-foreground">Address: </span>{company.address}</div>}
              {company.city && <div><span className="text-muted-foreground">City: </span>{company.city}</div>}
              {company.state && <div><span className="text-muted-foreground">State: </span>{company.state}</div>}
              {company.country && <div><span className="text-muted-foreground">Country: </span>{company.country}</div>}
              {company.notes && <div className="sm:col-span-2"><span className="text-muted-foreground">Notes: </span>{company.notes}</div>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Leads ({leads.length})</CardTitle></CardHeader>
            <CardContent>
              {leads.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No leads for this company.</p>
              ) : (
                <div className="space-y-2">
                  {leads.map((lead) => {
                    const cfg = LEAD_STATUS_CONFIG[lead.status as keyof typeof LEAD_STATUS_CONFIG];
                    return (
                      <Link key={lead.id} href={`/crm/leads/${lead.id}`}
                        className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors">
                        <div>
                          <p className="text-sm font-medium">{lead.title}</p>
                          <p className="text-xs text-muted-foreground">{new Date(lead.created_at).toLocaleDateString("en-IN")}</p>
                        </div>
                        <Badge variant="outline" className={`text-xs ${cfg?.color ?? ""}`}>{cfg?.label ?? lead.status}</Badge>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader><CardTitle className="text-base">Contacts ({contacts.length})</CardTitle></CardHeader>
            <CardContent>
              {contacts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No contacts.</p>
              ) : (
                <div className="space-y-2">
                  {contacts.map((c) => (
                    <Link key={c.id} href={`/crm/contacts/${c.id}`}
                      className="block rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors">
                      <p className="text-sm font-medium">{c.first_name} {c.last_name ?? ""}</p>
                      {c.job_title && <p className="text-xs text-muted-foreground">{c.job_title}</p>}
                      {c.email && <p className="text-xs text-muted-foreground">{c.email}</p>}
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <DocumentSection entityType="company" entityId={id} />
        </div>
      </div>
    </div>
  );
}
