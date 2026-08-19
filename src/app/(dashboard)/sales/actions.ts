"use server";

import { revalidatePath } from "next/cache";
import {
  createOpportunity as createOpportunityService,
  updateOpportunity as updateOpportunityService,
  createCall as createCallService,
  createFollowUp as createFollowUpService,
  updateFollowUp as updateFollowUpService,
} from "@/services/sales";
import type {
  SalesOpportunityInsert,
  SalesOpportunityUpdate,
  SalesCallInsert,
  SalesFollowUpInsert,
  SalesFollowUpUpdate,
  SalesStage,
} from "@/types/sales";

export async function createOpportunityAction(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean; id?: string }> {
  try {
    const data: SalesOpportunityInsert = {
      lead_id: formData.get("lead_id") as string,
      owner_id: (formData.get("owner_id") as string) || undefined,
      title: formData.get("title") as string,
      value: formData.get("value") ? Number(formData.get("value")) : undefined,
      currency: (formData.get("currency") as string) || "INR",
      stage: (formData.get("stage") as SalesStage) || "qualification",
      probability: formData.get("probability") ? Number(formData.get("probability")) : undefined,
      expected_close_date: (formData.get("expected_close_date") as string) || null,
      description: (formData.get("description") as string) || null,
    };

    if (!data.title) {
      return { error: "Opportunity title is required." };
    }
    if (!data.lead_id) {
      return { error: "Lead is required." };
    }

    const opp = await createOpportunityService(data);
    revalidatePath("/sales");
    revalidatePath("/sales/pipeline");
    revalidatePath("/sales/opportunities");
    revalidatePath("/dashboard");
    return { success: true, id: opp.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create opportunity." };
  }
}

export async function updateOpportunityAction(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  try {
    const id = formData.get("id") as string;
    if (!id) return { error: "Opportunity ID is required." };

    const data: SalesOpportunityUpdate = {
      lead_id: formData.get("lead_id") as string,
      owner_id: (formData.get("owner_id") as string) || undefined,
      title: formData.get("title") as string,
      value: formData.get("value") ? Number(formData.get("value")) : undefined,
      currency: (formData.get("currency") as string) || "INR",
      stage: (formData.get("stage") as SalesStage) || undefined,
      probability: formData.get("probability") ? Number(formData.get("probability")) : undefined,
      expected_close_date: (formData.get("expected_close_date") as string) || null,
      description: (formData.get("description") as string) || null,
      lost_reason: (formData.get("lost_reason") as string) || null,
    };

    await updateOpportunityService(id, data);
    revalidatePath("/sales");
    revalidatePath("/sales/pipeline");
    revalidatePath("/sales/opportunities");
    revalidatePath(`/sales/opportunities/${id}`);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update opportunity." };
  }
}

export async function logCallAction(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  try {
    const data: SalesCallInsert = {
      lead_id: formData.get("lead_id") as string,
      contact_id: (formData.get("contact_id") as string) || null,
      outcome: formData.get("outcome") as SalesCallInsert["outcome"],
      notes: (formData.get("notes") as string) || null,
      started_at: (formData.get("started_at") as string) || undefined,
      duration_seconds: formData.get("duration_seconds") ? Number(formData.get("duration_seconds")) : undefined,
    };

    if (!data.lead_id) {
      return { error: "Lead is required." };
    }
    if (!data.outcome) {
      return { error: "Call outcome is required." };
    }

    await createCallService(data);
    revalidatePath("/sales");
    revalidatePath("/sales/calls");
    revalidatePath(`/crm/leads/${data.lead_id}`);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to log call." };
  }
}

export async function createFollowUpAction(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean; id?: string }> {
  try {
    const data: SalesFollowUpInsert = {
      lead_id: formData.get("lead_id") as string,
      assigned_to: formData.get("assigned_to") as string,
      type: formData.get("type") as SalesFollowUpInsert["type"],
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      scheduled_at: formData.get("scheduled_at") as string,
    };

    if (!data.title) {
      return { error: "Follow-up title is required." };
    }
    if (!data.lead_id) {
      return { error: "Lead is required." };
    }
    if (!data.assigned_to) {
      return { error: "Assignee is required." };
    }
    if (!data.scheduled_at) {
      return { error: "Scheduled date is required." };
    }

    const fu = await createFollowUpService(data);
    revalidatePath("/sales");
    revalidatePath("/sales/follow-ups");
    revalidatePath(`/sales/opportunities/${data.lead_id}`);
    return { success: true, id: fu.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create follow-up." };
  }
}

export async function updateFollowUpAction(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  try {
    const id = formData.get("id") as string;
    if (!id) return { error: "Follow-up ID is required." };

    const data: SalesFollowUpUpdate = {
      status: (formData.get("status") as SalesFollowUpUpdate["status"]) || undefined,
      assigned_to: (formData.get("assigned_to") as string) || undefined,
      type: (formData.get("type") as SalesFollowUpUpdate["type"]) || undefined,
      title: (formData.get("title") as string) || undefined,
      description: (formData.get("description") as string) || undefined,
      scheduled_at: (formData.get("scheduled_at") as string) || undefined,
    };

    await updateFollowUpService(id, data);
    revalidatePath("/sales");
    revalidatePath("/sales/follow-ups");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update follow-up." };
  }
}

export async function updateOpportunityStageAction(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  try {
    const id = formData.get("id") as string;
    const stage = formData.get("stage") as SalesStage;
    if (!id || !stage) return { error: "Opportunity ID and stage are required." };
    await updateOpportunityService(id, { stage });
    revalidatePath("/sales");
    revalidatePath("/sales/pipeline");
    revalidatePath("/sales/opportunities");
    revalidatePath(`/sales/opportunities/${id}`);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update stage." };
  }
}
