import { notFound } from "next/navigation";
import { requirePermission, Permission } from "@/lib/authorization-server";
import { getProjectById, getTeamMembers } from "@/services/projects";
import { getClients } from "@/services/clients";
import { updateProjectAction } from "../../actions";
import { ProjectForm } from "@/components/projects/project-form";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProjectById(id);
  return { title: project ? `Edit ${project.name} | Projects` : "Project | Synplix Teams" };
}

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requirePermission(Permission.PROJECTS_MANAGE);
  const { id } = await params;

  const project = await getProjectById(id);
  if (!project) notFound();

  const [clientsResult, teamMembers] = await Promise.all([
    getClients({ limit: 200 }, profile),
    getTeamMembers(),
  ]);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-semibold">Edit {project.name}</h1>
      <ProjectForm
        project={project}
        clients={clientsResult.data.map((c) => ({
          id: c.id,
          client_code: c.client_code,
          company: c.company,
        }))}
        teamMembers={teamMembers}
        action={updateProjectAction}
      />
    </div>
  );
}
