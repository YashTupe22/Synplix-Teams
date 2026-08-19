"use server";

import { revalidatePath } from "next/cache";
import {
  createProject as createProjectService,
  updateProject as updateProjectService,
  addProjectMember as addMemberService,
  removeProjectMember as removeMemberService,
  createMilestone as createMilestoneService,
  updateMilestone as updateMilestoneService,
} from "@/services/projects";
import type {
  ProjectInsert,
  ProjectUpdate,
  ProjectMemberInsert,
  ProjectMilestoneInsert,
  ProjectMilestoneUpdate,
} from "@/types/clients";

export async function createProjectAction(
  _prevState: { error?: string; success?: boolean; id?: string } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean; id?: string }> {
  try {
    const data: ProjectInsert = {
      client_id: formData.get("client_id") as string,
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || null,
      status: (formData.get("status") as ProjectInsert["status"]) || "planning",
      priority: (formData.get("priority") as ProjectInsert["priority"]) || "medium",
      start_date: (formData.get("start_date") as string) || null,
      target_end_date: (formData.get("target_end_date") as string) || null,
      project_manager_id: (formData.get("project_manager_id") as string) || null,
      created_by: "",
    };

    if (!data.client_id) return { error: "Client is required." };
    if (!data.name?.trim()) return { error: "Project name is required." };

    const project = await createProjectService(data);
    revalidatePath("/projects");
    revalidatePath(`/clients/${data.client_id}`);
    revalidatePath("/dashboard");
    return { success: true, id: project.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create project." };
  }
}

export async function updateProjectAction(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  try {
    const id = formData.get("id") as string;
    if (!id) return { error: "Project ID is required." };

    const data: ProjectUpdate = {
      name: (formData.get("name") as string) || undefined,
      description: (formData.get("description") as string) || undefined,
      status: (formData.get("status") as ProjectUpdate["status"]) || undefined,
      priority: (formData.get("priority") as ProjectUpdate["priority"]) || undefined,
      start_date: (formData.get("start_date") as string) || undefined,
      target_end_date: (formData.get("target_end_date") as string) || undefined,
      progress_percent: formData.get("progress_percent") !== null
        ? Number(formData.get("progress_percent"))
        : undefined,
      project_manager_id: (formData.get("project_manager_id") as string) || undefined,
    };

    await updateProjectService(id, data);
    revalidatePath("/projects");
    revalidatePath(`/projects/${id}`);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update project." };
  }
}

export async function addProjectMemberAction(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  try {
    const data: ProjectMemberInsert = {
      project_id: formData.get("project_id") as string,
      user_id: formData.get("user_id") as string,
      role: (formData.get("role") as string) || null,
    };

    if (!data.project_id) return { error: "Project ID is required." };
    if (!data.user_id) return { error: "User is required." };

    await addMemberService(data);
    revalidatePath(`/projects/${data.project_id}`);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to add member." };
  }
}

export async function removeProjectMemberAction(
  projectId: string,
  userId: string
): Promise<{ error?: string; success?: boolean }> {
  try {
    await removeMemberService(projectId, userId);
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to remove member." };
  }
}

export async function createMilestoneAction(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  try {
    const data: ProjectMilestoneInsert = {
      project_id: formData.get("project_id") as string,
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || null,
      due_date: (formData.get("due_date") as string) || null,
      sort_order: formData.get("sort_order") !== null
        ? Number(formData.get("sort_order"))
        : 0,
    };

    if (!data.project_id) return { error: "Project ID is required." };
    if (!data.name?.trim()) return { error: "Milestone name is required." };

    await createMilestoneService(data);
    revalidatePath(`/projects/${data.project_id}`);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create milestone." };
  }
}

export async function updateMilestoneAction(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  try {
    const id = formData.get("id") as string;
    if (!id) return { error: "Milestone ID is required." };

    const data: ProjectMilestoneUpdate = {
      name: (formData.get("name") as string) || undefined,
      description: (formData.get("description") as string) || undefined,
      status: (formData.get("status") as ProjectMilestoneUpdate["status"]) || undefined,
      due_date: (formData.get("due_date") as string) || undefined,
    };

    await updateMilestoneService(id, data);
    revalidatePath(`/projects/${formData.get("project_id") as string}`);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update milestone." };
  }
}
