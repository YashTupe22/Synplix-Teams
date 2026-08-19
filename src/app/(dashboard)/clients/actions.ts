"use server";

import { revalidatePath } from "next/cache";
import {
  createClient as createClientService,
  updateClient as updateClientService,
  convertOpportunityToClient as convertService,
  createClientNote as createClientNoteService,
} from "@/services/clients";
import type {
  ClientInsert,
  ClientUpdate,
  ClientNoteInsert,
} from "@/types/clients";

export async function createClientAction(
  _prevState: { error?: string; success?: boolean; id?: string } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean; id?: string }> {
  try {
    const data: ClientInsert = {
      company_id: formData.get("company_id") as string,
      primary_contact_id: (formData.get("primary_contact_id") as string) || null,
      account_manager_id: (formData.get("account_manager_id") as string) || null,
      notes: (formData.get("notes") as string) || null,
      converted_from_lead_id: (formData.get("converted_from_lead_id") as string) || null,
      converted_from_opportunity_id: (formData.get("converted_from_opportunity_id") as string) || null,
      converted_by: "",
    };

    if (!data.company_id) {
      return { error: "Company is required." };
    }

    const client = await createClientService(data);
    revalidatePath("/clients");
    revalidatePath("/dashboard");
    return { success: true, id: client.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create client." };
  }
}

export async function updateClientAction(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  try {
    const id = formData.get("id") as string;
    if (!id) return { error: "Client ID is required." };

    const data: ClientUpdate = {
      primary_contact_id: (formData.get("primary_contact_id") as string) || null,
      status: (formData.get("status") as ClientUpdate["status"]) || undefined,
      account_manager_id: (formData.get("account_manager_id") as string) || null,
      notes: (formData.get("notes") as string) || undefined,
    };

    await updateClientService(id, data);
    revalidatePath("/clients");
    revalidatePath(`/clients/${id}`);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update client." };
  }
}

export async function convertToClientAction(
  _prevState: { error?: string; success?: boolean; id?: string } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean; id?: string }> {
  try {
    const opportunityId = formData.get("opportunity_id") as string;
    if (!opportunityId) return { error: "Opportunity ID is required." };

    const client = await convertService(opportunityId, {
      primary_contact_id: (formData.get("primary_contact_id") as string) || undefined,
      account_manager_id: (formData.get("account_manager_id") as string) || undefined,
      notes: (formData.get("notes") as string) || undefined,
    });

    revalidatePath("/clients");
    revalidatePath("/sales");
    revalidatePath(`/sales/opportunities/${opportunityId}`);
    revalidatePath("/dashboard");
    return { success: true, id: client.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to convert opportunity." };
  }
}

export async function addClientNoteAction(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  try {
    const clientId = formData.get("client_id") as string;
    const content = formData.get("content") as string;

    if (!clientId) return { error: "Client ID is required." };
    if (!content?.trim()) return { error: "Note content is required." };

    const data: ClientNoteInsert = {
      client_id: clientId,
      user_id: "",
      content: content.trim(),
    };

    await createClientNoteService(data);
    revalidatePath(`/clients/${clientId}`);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to add note." };
  }
}
