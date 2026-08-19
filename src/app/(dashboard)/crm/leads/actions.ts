"use server";

import { revalidatePath } from "next/cache";
import {
  createLead as createLeadService,
  updateLead as updateLeadService,
  archiveLead as archiveLeadService,
  createLeadActivity as createLeadActivityService,
  createLeadNote as createLeadNoteService,
} from "@/services/crm";
import type { LeadInsert, LeadUpdate, LeadStatus, LeadPriority, ActivityType } from "@/types/crm";

export async function createLeadAction(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean; id?: string }> {
  try {
    const data: LeadInsert = {
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      company_id: (formData.get("company_id") as string) || null,
      contact_id: (formData.get("contact_id") as string) || null,
      source_id: (formData.get("source_id") as string) || null,
      assigned_to: (formData.get("assigned_to") as string) || null,
      status: (formData.get("status") as LeadStatus) || "new",
      priority: ((formData.get("priority") as string) || "medium") as LeadPriority,
      estimated_value: formData.get("estimated_value")
        ? Number(formData.get("estimated_value"))
        : null,
      currency: (formData.get("currency") as string) || "INR",
      next_follow_up_at: (formData.get("next_follow_up_at") as string) || null,
    };

    if (!data.title) {
      return { error: "Lead title is required." };
    }

    const lead = await createLeadService(data);
    revalidatePath("/crm/leads");
    revalidatePath("/crm");
    revalidatePath("/dashboard");
    return { success: true, id: lead.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create lead." };
  }
}

export async function updateLeadAction(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  try {
    const id = formData.get("id") as string;
    if (!id) return { error: "Lead ID is required." };

    const data: LeadUpdate = {
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      company_id: (formData.get("company_id") as string) || null,
      contact_id: (formData.get("contact_id") as string) || null,
      source_id: (formData.get("source_id") as string) || null,
      assigned_to: (formData.get("assigned_to") as string) || null,
      status: formData.get("status") as LeadStatus,
      priority: ((formData.get("priority") as string) || "medium") as LeadPriority,
      estimated_value: formData.get("estimated_value")
        ? Number(formData.get("estimated_value"))
        : null,
      currency: (formData.get("currency") as string) || "INR",
      next_follow_up_at: (formData.get("next_follow_up_at") as string) || null,
      lost_reason: (formData.get("lost_reason") as string) || null,
    };

    await updateLeadService(id, data);
    revalidatePath("/crm/leads");
    revalidatePath(`/crm/leads/${id}`);
    revalidatePath("/crm");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update lead." };
  }
}

export async function archiveLeadAction(
  id: string
): Promise<{ error?: string; success?: boolean }> {
  try {
    await archiveLeadService(id);
    revalidatePath("/crm/leads");
    revalidatePath("/crm");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to archive lead." };
  }
}

export async function updateLeadStatusAction(
  id: string,
  status: LeadStatus
): Promise<{ error?: string; success?: boolean }> {
  try {
    await updateLeadService(id, { status });
    revalidatePath("/crm/leads");
    revalidatePath(`/crm/leads/${id}`);
    revalidatePath("/crm");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update status." };
  }
}

export async function addLeadActivityAction(
  leadId: string,
  activityType: ActivityType,
  subject: string,
  description: string
): Promise<{ error?: string; success?: boolean }> {
  try {
    await createLeadActivityService({
      lead_id: leadId,
      user_id: "", // set by service
      activity_type: activityType,
      subject: subject || null,
      description: description || null,
    });
    revalidatePath(`/crm/leads/${leadId}`);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to add activity." };
  }
}

export async function addLeadNoteAction(
  leadId: string,
  content: string
): Promise<{ error?: string; success?: boolean }> {
  try {
    if (!content.trim()) return { error: "Note content is required." };
    await createLeadNoteService({
      lead_id: leadId,
      user_id: "", // set by service
      content: content.trim(),
    });
    revalidatePath(`/crm/leads/${leadId}`);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to add note." };
  }
}
