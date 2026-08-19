"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { requirePermission, Permission } from "@/lib/authorization-server";
import type { UserRole } from "@/types/database";

export async function getTeamMembers() {
  const profile = await requirePermission(Permission.USERS_VIEW);

  const supabase = await createClient();

  // Admins see all, managers see active only
  let query = supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url, role, is_active, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (profile.role !== "admin") {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
    return { error: "Failed to load team members." };
  }

  return { data };
}

export async function updateUserRole(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const profile = await requirePermission(Permission.USERS_MANAGE);

  const targetId = formData.get("target_id") as string;
  const newRole = formData.get("role") as UserRole;

  if (!targetId || !newRole) {
    return { error: "Missing required fields." };
  }

  if (!["admin", "manager", "employee"].includes(newRole)) {
    return { error: "Invalid role." };
  }

  // Prevent self-role-change
  if (targetId === profile.id) {
    return { error: "You cannot change your own role." };
  }

  const supabase = await createClient();

  // Get current target info for audit log
  const { data: target } = await supabase
    .from("profiles")
    .select("email, role")
    .eq("id", targetId)
    .single();

  if (!target) {
    return { error: "User not found." };
  }

  // Update role
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ role: newRole })
    .eq("id", targetId);

  if (updateError) {
    return { error: "Failed to update role. Please try again." };
  }

  const service = createServiceClient();
  await service.from("audit_logs").insert({
    actor_id: profile.id,
    actor_email: profile.email,
    action: "role_changed",
    target_id: targetId,
    target_email: target.email,
    metadata: {
      old_role: target.role,
      new_role: newRole,
    },
  });

  revalidatePath("/team");
  return { success: true };
}

export async function toggleUserActive(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const profile = await requirePermission(Permission.USERS_MANAGE);

  const targetId = formData.get("target_id") as string;
  const shouldBeActive = formData.get("is_active") === "true";

  if (!targetId) {
    return { error: "Missing user ID." };
  }

  // Prevent self-deactivation
  if (targetId === profile.id) {
    return { error: "You cannot deactivate your own account." };
  }

  const supabase = await createClient();

  // Get current target info
  const { data: target } = await supabase
    .from("profiles")
    .select("email, is_active")
    .eq("id", targetId)
    .single();

  if (!target) {
    return { error: "User not found." };
  }

  // Update active status
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ is_active: shouldBeActive })
    .eq("id", targetId);

  if (updateError) {
    return { error: "Failed to update user status. Please try again." };
  }

  const service = createServiceClient();
  await service.from("audit_logs").insert({
    actor_id: profile.id,
    actor_email: profile.email,
    action: shouldBeActive ? "user_activated" : "user_deactivated",
    target_id: targetId,
    target_email: target.email,
    metadata: {
      previous_status: target.is_active ? "active" : "inactive",
      new_status: shouldBeActive ? "active" : "inactive",
    },
  });

  revalidatePath("/team");
  return { success: true };
}
