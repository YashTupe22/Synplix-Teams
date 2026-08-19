import { requirePermission, Permission } from "@/lib/authorization-server";
import { getLeads, getContacts } from "@/services/crm";
import { logCallAction } from "../../actions";
import { CallLogForm } from "@/components/sales/call-log-form";

export const metadata = {
  title: "Log Call | Sales | Synplix Teams",
};

export default async function NewCallPage({
  searchParams,
}: {
  searchParams: Promise<{ lead_id?: string }>;
}) {
  const profile = await requirePermission(Permission.SALES_VIEW);
  const { lead_id } = await searchParams;

  const [leadsResult, contactsResult] = await Promise.all([
    getLeads({ limit: 100 }, profile),
    getContacts({ limit: 200 }),
  ]);

  const leads = leadsResult.data.map((l) => ({ id: l.id, title: l.title }));
  const contacts = contactsResult.data.map((c) => ({
    id: c.id,
    first_name: c.first_name,
    last_name: c.last_name,
  }));

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-semibold">Log Call</h1>
      <CallLogForm
        leadId={lead_id}
        leads={leads}
        contacts={contacts}
        action={logCallAction}
      />
    </div>
  );
}
