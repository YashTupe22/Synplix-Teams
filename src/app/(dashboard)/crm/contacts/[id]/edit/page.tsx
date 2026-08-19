import { notFound } from "next/navigation";
import { requirePermission, Permission } from "@/lib/authorization-server";
import { getContactById, getCompanies } from "@/services/crm";
import { updateContactAction } from "../../actions";
import { ContactForm } from "@/components/crm/contact-form";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contact = await getContactById(id);
  return { title: contact ? `Edit ${contact.first_name}` : "Edit Contact" };
}

export default async function EditContactPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission(Permission.CRM_MANAGE);
  const { id } = await params;
  const contact = await getContactById(id);
  if (!contact) notFound();

  const companies = await getCompanies({ limit: 100 });

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-semibold">Edit Contact</h1>
      <ContactForm contact={contact} companies={companies.data} action={updateContactAction} />
    </div>
  );
}
