import { requirePermission, Permission } from "@/lib/authorization-server";
import { getProjects } from "@/services/projects";
import { PageHeader } from "@/components/page-header";
import { ProjectList } from "@/components/projects/project-list";

export const metadata = {
  title: "Projects | Synplix Teams",
};

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const profile = await requirePermission(Permission.PROJECTS_VIEW);
  const { page } = await searchParams;

  const data = await getProjects(
    { page: page ? Number(page) : 1, limit: 20 },
    profile
  );

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Projects"
        description="Manage your projects"
      />
      <ProjectList initialData={data} />
    </div>
  );
}
