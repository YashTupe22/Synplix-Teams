import { notFound } from "next/navigation";
import { requirePermission, Permission } from "@/lib/authorization-server";
import { getClientById, getClientNotes } from "@/services/clients";
import { getProjects } from "@/services/projects";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { CLIENT_STATUS_CONFIG } from "@/types/clients";
import { PROJECT_STATUS_CONFIG } from "@/types/clients";
import { Building2, User, Calendar, FileText, FolderKanban, Plus } from "lucide-react";
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

  const [projectsResult, notesResult] = await Promise.all([
    getProjects({ client_id: id, limit: 100 }, profile).catch(() => ({ data: [], total: 0, page: 1, limit: 100, totalPages: 0 })),
    getClientNotes(id, 1, 10).catch(() => ({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 })),
  ]);

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
        </div>
      </div>
    </div>
  );
}
