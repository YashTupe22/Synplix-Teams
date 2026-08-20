import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/authorization-server";
import { Permission } from "@/lib/authorization";
import {
  CATEGORY_TYPES,
  type Notification,
  type NotificationInsert,
  type NotificationWithRelations,
  type NotificationPreferences,
  type NotificationPreferencesUpdate,
  type NotificationFilters,
  type NotificationFilterType,
} from "@/types/notifications";
import type { PaginatedResult } from "@/types/clients";

// ──────────────────────────────────────────────
// Queries
// ──────────────────────────────────────────────

export async function getNotifications(
  filters: NotificationFilters = {}
): Promise<PaginatedResult<NotificationWithRelations>> {
  await requirePermission(Permission.DASHBOARD_VIEW);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const offset = (page - 1) * limit;
  const filter = filters.filter || "all";

  let query = supabase
    .from("notifications")
    .select(
      `
      *,
      actor:profiles!notifications_actor_id_fkey(id, full_name, email)
    `,
      { count: "exact" }
    )
    .eq("recipient_id", user.id);

  // Apply filters
  if (filter === "unread") {
    query = query.eq("is_read", false);
  } else if (filter !== "all" && CATEGORY_TYPES[filter]) {
    const types = CATEGORY_TYPES[filter];
    query = query.in("type", types);
  }

  query = query.order("created_at", { ascending: false });
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  const total = count || 0;
  return {
    data: (data as NotificationWithRelations[]) || [],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getUnreadNotifications(): Promise<NotificationWithRelations[]> {
  await requirePermission(Permission.DASHBOARD_VIEW);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("notifications")
    .select(
      `
      *,
      actor:profiles!notifications_actor_id_fkey(id, full_name, email)
    `
    )
    .eq("recipient_id", user.id)
    .eq("is_read", false)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) throw error;
  return (data as NotificationWithRelations[]) || [];
}

export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data, error } = await supabase
    .rpc("get_unread_notification_count", { user_id: user.id });

  if (error) return 0;
  return (data as number) || 0;
}

export async function getNotificationById(
  id: string
): Promise<NotificationWithRelations | null> {
  await requirePermission(Permission.DASHBOARD_VIEW);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notifications")
    .select(
      `
      *,
      actor:profiles!notifications_actor_id_fkey(id, full_name, email)
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data as NotificationWithRelations;
}

// ──────────────────────────────────────────────
// Mutations
// ──────────────────────────────────────────────

export async function createNotification(
  notification: NotificationInsert
): Promise<Notification> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notifications")
    .insert(notification)
    .select()
    .single();

  if (error) throw error;
  return data as Notification;
}

export async function createNotifications(
  notifications: NotificationInsert[]
): Promise<Notification[]> {
  if (notifications.length === 0) return [];

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notifications")
    .insert(notifications)
    .select();

  if (error) throw error;
  return (data as Notification[]) || [];
}

export async function markAsRead(id: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .rpc("mark_notification_read", {
      notification_id: id,
      user_id: user.id,
    });

  if (error) throw error;
  return data as boolean;
}

export async function markAllAsRead(): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .rpc("mark_all_notifications_read", {
      user_id: user.id,
    });

  if (error) throw error;
  return (data as number) || 0;
}

// ──────────────────────────────────────────────
// Preferences
// ──────────────────────────────────────────────

export async function getPreferences(): Promise<NotificationPreferences | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // Create default preferences
      const { data: newPrefs, error: insertError } = await supabase
        .from("notification_preferences")
        .insert({ user_id: user.id })
        .select()
        .single();
      if (insertError) return null;
      return newPrefs as NotificationPreferences;
    }
    return null;
  }
  return data as NotificationPreferences;
}

export async function updatePreferences(
  updates: NotificationPreferencesUpdate
): Promise<NotificationPreferences> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Upsert: create if not exists, update if exists
  const { data: existing } = await supabase
    .from("notification_preferences")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!existing) {
    const { data, error } = await supabase
      .from("notification_preferences")
      .insert({ user_id: user.id, ...updates })
      .select()
      .single();
    if (error) throw error;
    return data as NotificationPreferences;
  }

  const { data, error } = await supabase
    .from("notification_preferences")
    .update(updates)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw error;
  return data as NotificationPreferences;
}

// ──────────────────────────────────────────────
// Helper: Check if user wants this notification type
// ──────────────────────────────────────────────

export async function shouldNotify(
  userId: string,
  category: string
): Promise<boolean> {
  const supabase = await createClient();

  const columnMap: Record<string, string> = {
    tasks: "task_notifications",
    project: "project_notifications",
    sales: "sales_notifications",
    client: "client_notifications",
    finance: "finance_notifications",
    comments: "comment_notifications",
  };

  const column = columnMap[category] || `${category}_notifications`;

  const { data } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!data) return true; // Default to true if no preferences
  const prefs = data as NotificationPreferences;
  return (prefs as unknown as Record<string, boolean>)[column] !== false;
}

// ──────────────────────────────────────────────
// Helper: Get project member IDs
// ──────────────────────────────────────────────

export async function getProjectMemberIds(projectId: string): Promise<string[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("project_members")
    .select("user_id")
    .eq("project_id", projectId);

  if (!data) return [];
  return data.map((m: { user_id: string }) => m.user_id);
}

// ──────────────────────────────────────────────
// Helper: Get manager IDs
// ──────────────────────────────────────────────

export async function getManagerIds(): Promise<string[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "manager")
    .eq("is_active", true);

  if (!data) return [];
  return data.map((p: { id: string }) => p.id);
}
