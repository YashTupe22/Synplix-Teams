"use server";

import { revalidatePath } from "next/cache";
import {
  createContact as createContactService,
  updateContact as updateContactService,
} from "@/services/crm";
import type { ContactInsert, ContactUpdate } from "@/types/crm";

export async function createContactAction(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean; id?: string }> {
  try {
    const data: ContactInsert = {
      first_name: formData.get("first_name") as string,
      last_name: (formData.get("last_name") as string) || null,
      company_id: (formData.get("company_id") as string) || null,
      job_title: (formData.get("job_title") as string) || null,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      alternate_phone: (formData.get("alternate_phone") as string) || null,
      linkedin_url: (formData.get("linkedin_url") as string) || null,
      notes: (formData.get("notes") as string) || null,
      created_by: "",
    };

    if (!data.first_name) {
      return { error: "First name is required." };
    }

    const contact = await createContactService(data);
    revalidatePath("/crm/contacts");
    revalidatePath("/crm");
    return { success: true, id: contact.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create contact." };
  }
}

export async function updateContactAction(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  try {
    const id = formData.get("id") as string;
    if (!id) return { error: "Contact ID is required." };

    const data: ContactUpdate = {
      first_name: formData.get("first_name") as string,
      last_name: (formData.get("last_name") as string) || null,
      company_id: (formData.get("company_id") as string) || null,
      job_title: (formData.get("job_title") as string) || null,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      alternate_phone: (formData.get("alternate_phone") as string) || null,
      linkedin_url: (formData.get("linkedin_url") as string) || null,
      notes: (formData.get("notes") as string) || null,
    };

    await updateContactService(id, data);
    revalidatePath("/crm/contacts");
    revalidatePath(`/crm/contacts/${id}`);
    revalidatePath("/crm");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update contact." };
  }
}
