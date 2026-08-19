"use server";

import { revalidatePath } from "next/cache";
import {
  createCompany as createCompanyService,
  updateCompany as updateCompanyService,
} from "@/services/crm";
import type { CompanyInsert, CompanyUpdate } from "@/types/crm";

export async function createCompanyAction(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean; id?: string }> {
  try {
    const data: CompanyInsert = {
      name: formData.get("name") as string,
      website: (formData.get("website") as string) || null,
      industry: (formData.get("industry") as string) || null,
      phone: (formData.get("phone") as string) || null,
      email: (formData.get("email") as string) || null,
      address: (formData.get("address") as string) || null,
      city: (formData.get("city") as string) || null,
      state: (formData.get("state") as string) || null,
      country: (formData.get("country") as string) || null,
      postal_code: (formData.get("postal_code") as string) || null,
      notes: (formData.get("notes") as string) || null,
      created_by: "",
    };

    if (!data.name) {
      return { error: "Company name is required." };
    }

    const company = await createCompanyService(data);
    revalidatePath("/crm/companies");
    revalidatePath("/crm");
    return { success: true, id: company.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create company." };
  }
}

export async function updateCompanyAction(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  try {
    const id = formData.get("id") as string;
    if (!id) return { error: "Company ID is required." };

    const data: CompanyUpdate = {
      name: formData.get("name") as string,
      website: (formData.get("website") as string) || null,
      industry: (formData.get("industry") as string) || null,
      phone: (formData.get("phone") as string) || null,
      email: (formData.get("email") as string) || null,
      address: (formData.get("address") as string) || null,
      city: (formData.get("city") as string) || null,
      state: (formData.get("state") as string) || null,
      country: (formData.get("country") as string) || null,
      postal_code: (formData.get("postal_code") as string) || null,
      notes: (formData.get("notes") as string) || null,
    };

    await updateCompanyService(id, data);
    revalidatePath("/crm/companies");
    revalidatePath(`/crm/companies/${id}`);
    revalidatePath("/crm");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update company." };
  }
}
