import { requirePermission, Permission } from "@/lib/authorization-server";
import { getClients } from "@/services/clients";
import { PageHeader } from "@/components/page-header";
import { ClientList } from "@/components/clients/client-list";

export const metadata = {
  title: "Clients | Synplix Teams",
};

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const profile = await requirePermission(Permission.CLIENTS_VIEW);
  const { page } = await searchParams;

  const data = await getClients(
    { page: page ? Number(page) : 1, limit: 20 },
    profile
  );

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Clients"
        description="Manage your client relationships"
      />
      <ClientList initialData={data} />
    </div>
  );
}
