"use server";

import { revalidatePath } from "next/cache";
import {
  createTask as createTaskService,
  updateTask as updateTaskService,
  deleteTask as deleteTaskService,
  createTaskComment as createTaskCommentService,
  updateTaskComment as updateTaskCommentService,
  deleteTaskComment as deleteTaskCommentService,
} from "@/services/tasks";
import { TaskInsert, TaskUpdate, TaskStatus, TaskPriority } from "@/types/tasks";

type ActionState = {
  error?: string;
  success?: boolean;
  id?: string;
};

export async function createTaskAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const data: TaskInsert = {
      project_id: formData.get("project_id") as string,
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      assigned_to: (formData.get("assigned_to") as string) || null,
      milestone_id: (formData.get("milestone_id") as string) || null,
      priority: (formData.get("priority") as TaskPriority) || "medium",
      due_date: (formData.get("due_date") as string) || null,
      created_by: "", // Set by service
    };

    if (!data.project_id) return { error: "Project is required" };
    if (!data.title || data.title.trim().length === 0)
      return { error: "Title is required" };

    const result = await createTaskService(data);

    revalidatePath("/tasks");
    revalidatePath("/tasks/my");
    revalidatePath(`/projects/${data.project_id}`);
    revalidatePath("/dashboard");
    revalidatePath("/workspace");

    return { success: true, id: result.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create task" };
  }
}

export async function updateTaskAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = formData.get("id") as string;
    if (!id) return { error: "Task ID is required" };

    const updates: TaskUpdate = {};

    if (formData.has("title")) updates.title = formData.get("title") as string;
    if (formData.has("description"))
      updates.description = (formData.get("description") as string) || null;
    if (formData.has("assigned_to"))
      updates.assigned_to = (formData.get("assigned_to") as string) || null;
    if (formData.has("milestone_id"))
      updates.milestone_id = (formData.get("milestone_id") as string) || null;
    if (formData.has("priority"))
      updates.priority = formData.get("priority") as TaskPriority;
    if (formData.has("due_date"))
      updates.due_date = (formData.get("due_date") as string) || null;

    const result = await updateTaskService(id, updates);

    revalidatePath("/tasks");
    revalidatePath("/tasks/my");
    revalidatePath("/tasks/[id]");
    revalidatePath(`/tasks/${id}`);
    revalidatePath(`/projects/${result.project_id}`);
    revalidatePath("/dashboard");
    revalidatePath("/workspace");

    return { success: true, id: result.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update task" };
  }
}

export async function updateTaskStatusAction(
  id: string,
  status: TaskStatus
): Promise<ActionState> {
  try {
    const result = await updateTaskService(id, { status });

    revalidatePath("/tasks");
    revalidatePath("/tasks/my");
    revalidatePath("/tasks/board");
    revalidatePath(`/tasks/${id}`);
    revalidatePath(`/projects/${result.project_id}`);
    revalidatePath("/dashboard");
    revalidatePath("/workspace");

    return { success: true, id: result.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update status" };
  }
}

export async function deleteTaskAction(
  id: string
): Promise<ActionState> {
  try {
    await deleteTaskService(id);

    revalidatePath("/tasks");
    revalidatePath("/tasks/my");
    revalidatePath("/tasks/board");
    revalidatePath("/dashboard");
    revalidatePath("/workspace");

    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to delete task" };
  }
}

export async function createTaskCommentAction(
  taskId: string,
  content: string
): Promise<ActionState> {
  try {
    if (!content || content.trim().length === 0) {
      return { error: "Comment cannot be empty" };
    }

    await createTaskCommentService({ task_id: taskId, author_id: "", content });

    revalidatePath(`/tasks/${taskId}`);

    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to add comment" };
  }
}

export async function updateTaskCommentAction(
  commentId: string,
  content: string,
  taskId: string
): Promise<ActionState> {
  try {
    if (!content || content.trim().length === 0) {
      return { error: "Comment cannot be empty" };
    }

    await updateTaskCommentService(commentId, content);

    revalidatePath(`/tasks/${taskId}`);

    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update comment" };
  }
}

export async function deleteTaskCommentAction(
  commentId: string,
  taskId: string
): Promise<ActionState> {
  try {
    await deleteTaskCommentService(commentId);

    revalidatePath(`/tasks/${taskId}`);

    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to delete comment" };
  }
}
