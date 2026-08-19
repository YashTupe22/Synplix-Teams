import type { Company, Contact } from "@/types/crm";
import type { Lead } from "@/types/crm";
import type { SalesOpportunity } from "@/types/sales";

// ──────────────────────────────────────────────
// Enums / Types
// ──────────────────────────────────────────────

export type ClientStatus = "active" | "inactive" | "on_hold" | "archived";

export type ProjectStatus = "planning" | "active" | "on_hold" | "completed" | "cancelled";

export type ProjectPriority = "low" | "medium" | "high" | "urgent";

export type MilestoneStatus = "pending" | "in_progress" | "completed" | "blocked";

// ──────────────────────────────────────────────
// Core entities
// ──────────────────────────────────────────────

export interface Client {
  id: string;
  company_id: string;
  primary_contact_id: string | null;
  client_code: string;
  status: ClientStatus;
  account_manager_id: string | null;
  notes: string | null;
  converted_from_lead_id: string | null;
  converted_from_opportunity_id: string | null;
  converted_by: string;
  converted_at: string;
  created_at: string;
  updated_at: string;
}

export interface ClientInsert {
  id?: string;
  company_id: string;
  primary_contact_id?: string | null;
  client_code?: string;
  status?: ClientStatus;
  account_manager_id?: string | null;
  notes?: string | null;
  converted_from_lead_id?: string | null;
  converted_from_opportunity_id?: string | null;
  converted_by: string;
  converted_at?: string;
}

export interface ClientUpdate {
  company_id?: string;
  primary_contact_id?: string | null;
  status?: ClientStatus;
  account_manager_id?: string | null;
  notes?: string | null;
}

export interface ClientNote {
  id: string;
  client_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface ClientNoteInsert {
  id?: string;
  client_id: string;
  user_id: string;
  content: string;
}

export interface ClientNoteUpdate {
  content?: string;
}

export interface Project {
  id: string;
  client_id: string;
  name: string;
  description: string | null;
  project_code: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  start_date: string | null;
  target_end_date: string | null;
  completed_at: string | null;
  progress_percent: number;
  project_manager_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectInsert {
  id?: string;
  client_id: string;
  name: string;
  description?: string | null;
  project_code?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  start_date?: string | null;
  target_end_date?: string | null;
  completed_at?: string | null;
  progress_percent?: number;
  project_manager_id?: string | null;
  created_by: string;
}

export interface ProjectUpdate {
  client_id?: string;
  name?: string;
  description?: string | null;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  start_date?: string | null;
  target_end_date?: string | null;
  completed_at?: string | null;
  progress_percent?: number;
  project_manager_id?: string | null;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: string | null;
  created_at: string;
}

export interface ProjectMemberInsert {
  id?: string;
  project_id: string;
  user_id: string;
  role?: string | null;
}

export interface ProjectMilestone {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  status: MilestoneStatus;
  due_date: string | null;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectMilestoneInsert {
  id?: string;
  project_id: string;
  name: string;
  description?: string | null;
  status?: MilestoneStatus;
  due_date?: string | null;
  completed_at?: string | null;
  sort_order?: number;
}

export interface ProjectMilestoneUpdate {
  name?: string;
  description?: string | null;
  status?: MilestoneStatus;
  due_date?: string | null;
  completed_at?: string | null;
  sort_order?: number;
}

// ──────────────────────────────────────────────
// UI-specific types (with relations)
// ──────────────────────────────────────────────

export interface ClientWithRelations extends Client {
  company: Pick<Company, "id" | "name" | "website" | "phone" | "email" | "city" | "country"> | null;
  primary_contact: Pick<Contact, "id" | "first_name" | "last_name" | "email" | "phone"> | null;
  account_manager: { id: string; full_name: string | null; email: string } | null;
  converted_by_user: { id: string; full_name: string | null; email: string } | null;
  lead: Pick<Lead, "id" | "title"> | null;
  opportunity: Pick<SalesOpportunity, "id" | "title" | "value"> | null;
  active_projects_count: number;
  total_projects_count: number;
}

export interface ClientNoteWithUser extends ClientNote {
  user: { id: string; full_name: string | null; email: string } | null;
}

export interface ProjectWithRelations extends Project {
  client: Pick<Client, "id" | "client_code" | "status"> & {
    company: Pick<Company, "id" | "name"> | null;
  } | null;
  project_manager: { id: string; full_name: string | null; email: string } | null;
  created_by_user: { id: string; full_name: string | null; email: string } | null;
  members_count: number;
  milestones_completed: number;
  milestones_total: number;
}

export interface ProjectMemberWithUser extends ProjectMember {
  user: { id: string; full_name: string | null; email: string; role: string } | null;
}

export interface ProjectMilestoneWithStats extends ProjectMilestone {
  _count?: { tasks: number };
}

// ──────────────────────────────────────────────
// Config / constants
// ──────────────────────────────────────────────

export const CLIENT_STATUS_CONFIG: Record<ClientStatus, { label: string; color: string; bgColor: string }> = {
  active: { label: "Active", color: "text-green-600", bgColor: "bg-green-500" },
  inactive: { label: "Inactive", color: "text-muted-foreground", bgColor: "bg-muted" },
  on_hold: { label: "On Hold", color: "text-amber-600", bgColor: "bg-amber-500" },
  archived: { label: "Archived", color: "text-red-600", bgColor: "bg-red-500" },
};

export const PROJECT_STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string; bgColor: string }> = {
  planning: { label: "Planning", color: "text-blue-600", bgColor: "bg-blue-500" },
  active: { label: "Active", color: "text-green-600", bgColor: "bg-green-500" },
  on_hold: { label: "On Hold", color: "text-amber-600", bgColor: "bg-amber-500" },
  completed: { label: "Completed", color: "text-emerald-600", bgColor: "bg-emerald-500" },
  cancelled: { label: "Cancelled", color: "text-red-600", bgColor: "bg-red-500" },
};

export const PROJECT_PRIORITY_CONFIG: Record<ProjectPriority, { label: string; color: string }> = {
  low: { label: "Low", color: "text-muted-foreground" },
  medium: { label: "Medium", color: "text-blue-600" },
  high: { label: "High", color: "text-orange-600" },
  urgent: { label: "Urgent", color: "text-red-600" },
};

export const MILESTONE_STATUS_CONFIG: Record<MilestoneStatus, { label: string; color: string; icon: string }> = {
  pending: { label: "Pending", color: "text-muted-foreground", icon: "○" },
  in_progress: { label: "In Progress", color: "text-blue-600", icon: "●" },
  completed: { label: "Completed", color: "text-green-600", icon: "✓" },
  blocked: { label: "Blocked", color: "text-red-600", icon: "✕" },
};

// ──────────────────────────────────────────────
// Filters & pagination
// ──────────────────────────────────────────────

export interface ClientFilters {
  search?: string;
  status?: ClientStatus[];
  account_manager_id?: string;
  page?: number;
  limit?: number;
}

export interface ProjectFilters {
  search?: string;
  client_id?: string;
  status?: ProjectStatus[];
  priority?: ProjectPriority[];
  project_manager_id?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
