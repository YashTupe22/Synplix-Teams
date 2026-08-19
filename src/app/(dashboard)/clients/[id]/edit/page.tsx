import { notFound } from "next/navigation";
import { requirePermission, Permission } from "@/lib/authorization-server";
import { getClientById } from "@/services/clients";
import { getContacts } from "@/services/crm";
import { getTeamMembers } from "@/services/projects";
import { updateClientAction } from "../../actions";
import { ClientForm } from "@/components/clients/client-form";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await getClientById(id);
  return { title: client ? `Edit ${client.client_code} | Clients` : "Client | Synplix Teams" };
}

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission(Permission.CLIENTS_MANAGE);
  const { id } = await params;

  const client = await getClientById(id);
  if (!client) notFound();

  const [contactsResult, teamMembers] = await Promise.all([
    getContacts({ limit: 200 }),
    getTeamMembers(),
  ]);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-semibold">Edit {client.client_code}</h1>
      <ClientForm
        client={client}
        companies={[]}
        contacts={contactsResult.data}
        teamMembers={teamMembers}
        action={updateClientAction}
      />
    </div>
  );
}
