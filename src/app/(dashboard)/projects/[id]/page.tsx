import { notFound } from "next/navigation";
import { requirePermission, Permission } from "@/lib/authorization-server";
import { getProjectById, getProjectMembers, getProjectMilestones, getTeamMembers } from "@/services/projects";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { PROJECT_STATUS_CONFIG, PROJECT_PRIORITY_CONFIG } from "@/types/clients";
import { MilestoneList } from "@/components/projects/milestone-list";
import { MemberList } from "@/components/projects/member-list";
import { createMilestoneAction, updateMilestoneAction, addProjectMemberAction, removeProjectMemberAction } from "../actions";
import { Calendar, User, FolderKanban, CheckCircle } from "lucide-react";
import Link from "next/link";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProjectById(id);
  return { title: project ? `${project.name} | Projects` : "Project | Synplix Teams" };
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission(Permission.PROJECTS_VIEW);
  const { id } = await params;

  const project = await getProjectById(id);
  if (!project) notFound();

  const [members, milestones, teamMembers] = await Promise.all([
    getProjectMembers(id).catch(() => []),
    getProjectMilestones(id).catch(() => []),
    getTeamMembers(),
  ]);

  const statusCfg = PROJECT_STATUS_CONFIG[project.status];
  const priorityCfg = PROJECT_PRIORITY_CONFIG[project.priority];

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title={project.name}
        description={project.project_code}
      >
        <div className="flex items-center gap-2">
          <Link
            href={`/projects/${id}/edit`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Edit
          </Link>
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <FolderKanban className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Client</p>
                    <Link href={`/clients/${project.client?.id}`} className="text-sm text-muted-foreground hover:underline">
                      {project.client?.company?.name ?? "—"} ({project.client?.client_code})
                    </Link>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <User className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Project Manager</p>
                    <p className="text-sm text-muted-foreground">
                      {project.project_manager?.full_name ?? "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Timeline</p>
                    <p className="text-sm text-muted-foreground">
                      {project.start_date
                        ? new Date(project.start_date).toLocaleDateString("en-IN")
                        : "Not set"}{" "}
                      –{" "}
                      {project.target_end_date
                        ? new Date(project.target_end_date).toLocaleDateString("en-IN")
                        : "Not set"}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Status & Priority</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={statusCfg.color}>{statusCfg.label}</Badge>
                    <span className={`text-xs ${priorityCfg.color}`}>{priorityCfg.label}</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Progress</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${project.progress_percent}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{project.progress_percent}%</span>
                </div>
              </div>

              {project.description && (
                <div>
                  <p className="text-sm font-medium mb-1">Description</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{project.description}</p>
                </div>
              )}

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Milestones: {project.milestones_completed}/{project.milestones_total} completed</span>
                <span>Members: {project.members_count}</span>
              </div>
            </CardContent>
          </Card>

          <MilestoneList
            milestones={milestones}
            projectId={id}
            createAction={createMilestoneAction}
            updateAction={updateMilestoneAction}
          />
        </div>

        <div className="space-y-6">
          <MemberList
            members={members}
            projectId={id}
            teamMembers={teamMembers}
            addAction={addProjectMemberAction}
            removeAction={removeProjectMemberAction}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="size-4" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Project Code</span>
                <span className="font-mono">{project.project_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created by</span>
                <span>{project.created_by_user?.full_name ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{new Date(project.created_at).toLocaleDateString("en-IN")}</span>
              </div>
              {project.completed_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Completed</span>
                  <span>{new Date(project.completed_at).toLocaleDateString("en-IN")}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
