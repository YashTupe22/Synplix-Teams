import { requirePermission, Permission } from "@/lib/authorization-server";
import { createContactAction } from "../actions";
import { ContactForm } from "@/components/crm/contact-form";
import { getCompanies } from "@/services/crm";

export const metadata = { title: "New Contact | CRM | Synplix Teams" };

export default async function NewContactPage() {
  await requirePermission(Permission.CRM_MANAGE);
  const companies = await getCompanies({ limit: 100 });

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-semibold">New Contact</h1>
      <ContactForm companies={companies.data} action={createContactAction} />
    </div>
  );
}
