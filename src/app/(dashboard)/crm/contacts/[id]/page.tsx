import { notFound } from "next/navigation";
import { requirePermission, Permission } from "@/lib/authorization-server";
import { getContactById } from "@/services/crm";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { Pencil, Mail, Phone, ExternalLink } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contact = await getContactById(id);
  return { title: contact ? `${contact.first_name} ${contact.last_name ?? ""} | Contacts` : "Contact" };
}

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requirePermission(Permission.CRM_VIEW);
  const { id } = await params;
  const contact = await getContactById(id);

  if (!contact) notFound();
  const isAdmin = profile.role === "admin";
  const isManager = profile.role === "manager";

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title={`${contact.first_name} ${contact.last_name ?? ""}`}
          description={contact.job_title ?? ""}
        />
        {(isAdmin || isManager) && (
          <Link href={`/crm/contacts/${contact.id}/edit`} className={buttonVariants({ size: "sm" })}>
            <Pencil className="mr-1.5 size-3.5" /> Edit
          </Link>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Contact Details</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {contact.company && (
                <div><span className="text-muted-foreground">Company: </span>
                  <Link href={`/crm/companies/${contact.company.id}`} className="text-primary hover:underline">
                    {contact.company.name}
                  </Link>
                </div>
              )}
              {contact.email && (
                <div className="flex items-center gap-2">
                  <Mail className="size-4 text-muted-foreground" />
                  <a href={`mailto:${contact.email}`} className="text-primary hover:underline">{contact.email}</a>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="size-4 text-muted-foreground" />
                  <a href={`tel:${contact.phone}`} className="hover:underline">{contact.phone}</a>
                </div>
              )}
              {contact.alternate_phone && (
                <div><span className="text-muted-foreground">Alt Phone: </span>{contact.alternate_phone}</div>
              )}
              {contact.linkedin_url && (
                <div className="flex items-center gap-2">
                  <ExternalLink className="size-4 text-muted-foreground" />
                  <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    LinkedIn Profile
                  </a>
                </div>
              )}
              {contact.notes && (
                <div><span className="text-muted-foreground">Notes: </span>{contact.notes}</div>
              )}
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader><CardTitle className="text-base">Activity</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-4">
                Contact activity tracking coming in a future phase.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
