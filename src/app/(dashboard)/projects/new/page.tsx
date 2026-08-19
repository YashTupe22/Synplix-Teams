import { requirePermission, Permission } from "@/lib/authorization-server";
import { getClients } from "@/services/clients";
import { getTeamMembers } from "@/services/projects";
import { createProjectAction } from "../actions";
import { ProjectForm } from "@/components/projects/project-form";

export const metadata = {
  title: "New Project | Synplix Teams",
};

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ client_id?: string }>;
}) {
  const profile = await requirePermission(Permission.PROJECTS_MANAGE);
  const { client_id: _client_id } = await searchParams;

  const [clientsResult, teamMembers] = await Promise.all([
    getClients({ limit: 200 }, profile),
    getTeamMembers(),
  ]);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-semibold">New Project</h1>
      <ProjectForm
        clients={clientsResult.data.map((c) => ({
          id: c.id,
          client_code: c.client_code,
          company: c.company,
        }))}
        teamMembers={teamMembers}
        action={createProjectAction}
      />
    </div>
  );
}
