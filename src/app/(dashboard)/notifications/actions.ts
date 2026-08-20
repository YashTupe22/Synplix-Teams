"use server";

import { revalidatePath } from "next/cache";
import {
  markAsRead as markAsReadService,
  markAllAsRead as markAllAsReadService,
  updatePreferences as updatePreferencesService,
} from "@/services/notifications";
import type { NotificationPreferencesUpdate } from "@/types/notifications";

type ActionState = {
  error?: string;
  success?: boolean;
};

export async function markNotificationReadAction(
  notificationId: string
): Promise<ActionState> {
  try {
    await markAsReadService(notificationId);
    revalidatePath("/notifications");
    revalidatePath("/workspace");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to mark notification as read" };
  }
}

export async function markAllNotificationsReadAction(): Promise<ActionState> {
  try {
    await markAllAsReadService();
    revalidatePath("/notifications");
    revalidatePath("/workspace");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to mark all notifications as read" };
  }
}

export async function updateNotificationPreferencesAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const updates: NotificationPreferencesUpdate = {
      task_notifications: formData.get("task_notifications") === "on",
      project_notifications: formData.get("project_notifications") === "on",
      sales_notifications: formData.get("sales_notifications") === "on",
      client_notifications: formData.get("client_notifications") === "on",
      finance_notifications: formData.get("finance_notifications") === "on",
      comment_notifications: formData.get("comment_notifications") === "on",
    };

    await updatePreferencesService(updates);
    revalidatePath("/settings/notifications");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update preferences" };
  }
}
