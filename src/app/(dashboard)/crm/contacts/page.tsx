import { requirePermission, Permission } from "@/lib/authorization-server";
import { getContacts } from "@/services/crm";
import { PageHeader } from "@/components/page-header";
import { ContactList } from "@/components/crm/contact-list";

export const metadata = { title: "Contacts | CRM | Synplix Teams" };

export default async function ContactsPage() {
  const profile = await requirePermission(Permission.CRM_VIEW);
  const data = await getContacts({ page: 1, limit: 20 });

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Contacts" description="Manage your contacts" />
      <ContactList
        initialData={data}
        isAdmin={profile.role === "admin"}
        isManager={profile.role === "manager"}
      />
    </div>
  );
}
