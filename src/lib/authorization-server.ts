import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasPermission, Permission } from "@/lib/authorization";
import type { Profile, UserRole } from "@/types/database";

export { Permission };

// ──────────────────────────────────────────────
// Server-side authorization guards
// ──────────────────────────────────────────────

export async function requireAuth(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  return profile;
}

export async function requirePermission(permission: Permission): Promise<Profile> {
  const profile = await requireAuth();
  if (!hasPermission(profile, permission)) {
    redirect("/unauthorized");
  }
  return profile;
}

export async function requireRole(role: UserRole): Promise<Profile> {
  const profile = await requireAuth();
  if (profile.role !== role) {
    redirect("/unauthorized");
  }
  return profile;
}

async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.is_active) return null;

  return profile;
}
