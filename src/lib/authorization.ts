import type { Profile, UserRole } from "@/types/database";

// ──────────────────────────────────────────────
// Permission definitions
// ──────────────────────────────────────────────

export const Permission = {
  // Dashboard
  DASHBOARD_VIEW: "dashboard.view",

  // Users / Team
  USERS_VIEW: "users.view",
  USERS_MANAGE: "users.manage",

  // CRM
  CRM_VIEW: "crm.view",
  CRM_MANAGE: "crm.manage",

  // Sales
  SALES_VIEW: "sales.view",
  SALES_MANAGE: "sales.manage",

  // Clients
  CLIENTS_VIEW: "clients.view",
  CLIENTS_MANAGE: "clients.manage",

  // Projects
  PROJECTS_VIEW: "projects.view",
  PROJECTS_MANAGE: "projects.manage",

  // Tasks
  TASKS_VIEW: "tasks.view",
  TASKS_MANAGE: "tasks.manage",

  // Finance
  FINANCE_VIEW: "finance.view",
  FINANCE_MANAGE: "finance.manage",

  // Documents
  DOCUMENTS_VIEW: "documents.view",
  DOCUMENTS_MANAGE: "documents.manage",

  // Analytics
  ANALYTICS_VIEW: "analytics.view",

  // Settings
  SETTINGS_MANAGE: "settings.manage",

  // Profile
  PROFILE_VIEW: "profile.view",
  PROFILE_EDIT: "profile.edit",
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

// ──────────────────────────────────────────────
// Role → Permission mapping
// ──────────────────────────────────────────────

const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  admin: [
    Permission.DASHBOARD_VIEW,
    Permission.USERS_VIEW,
    Permission.USERS_MANAGE,
    Permission.CRM_VIEW,
    Permission.CRM_MANAGE,
    Permission.SALES_VIEW,
    Permission.SALES_MANAGE,
    Permission.CLIENTS_VIEW,
    Permission.CLIENTS_MANAGE,
    Permission.PROJECTS_VIEW,
    Permission.PROJECTS_MANAGE,
    Permission.TASKS_VIEW,
    Permission.TASKS_MANAGE,
    Permission.FINANCE_VIEW,
    Permission.FINANCE_MANAGE,
    Permission.DOCUMENTS_VIEW,
    Permission.DOCUMENTS_MANAGE,
    Permission.ANALYTICS_VIEW,
    Permission.SETTINGS_MANAGE,
    Permission.PROFILE_VIEW,
    Permission.PROFILE_EDIT,
  ],
  manager: [
    Permission.DASHBOARD_VIEW,
    Permission.USERS_VIEW,
    Permission.CRM_VIEW,
    Permission.CRM_MANAGE,
    Permission.SALES_VIEW,
    Permission.SALES_MANAGE,
    Permission.CLIENTS_VIEW,
    Permission.CLIENTS_MANAGE,
    Permission.PROJECTS_VIEW,
    Permission.PROJECTS_MANAGE,
    Permission.TASKS_VIEW,
    Permission.TASKS_MANAGE,
    Permission.ANALYTICS_VIEW,
    Permission.PROFILE_VIEW,
    Permission.PROFILE_EDIT,
  ],
  employee: [
    Permission.DASHBOARD_VIEW,
    Permission.TASKS_VIEW,
    Permission.TASKS_MANAGE,
    Permission.PROJECTS_VIEW,
    Permission.PROFILE_VIEW,
    Permission.PROFILE_EDIT,
  ],
};

// ──────────────────────────────────────────────
// Client-safe authorization functions
// ──────────────────────────────────────────────

export function getPermissionsForRole(role: UserRole): readonly Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function hasPermission(
  profile: Profile | null | undefined,
  permission: Permission
): boolean {
  if (!profile || !profile.is_active) return false;
  const permissions = getPermissionsForRole(profile.role as UserRole);
  return permissions.includes(permission);
}

export function hasAnyPermission(
  profile: Profile | null | undefined,
  permissions: Permission[]
): boolean {
  if (!profile || !profile.is_active) return false;
  return permissions.some((p) => hasPermission(profile, p));
}

export function hasAllPermissions(
  profile: Profile | null | undefined,
  permissions: Permission[]
): boolean {
  if (!profile || !profile.is_active) return false;
  return permissions.every((p) => hasPermission(profile, p));
}
