export type LeadStatus =
  | "new"
  | "contacted"
  | "interested"
  | "meeting"
  | "proposal"
  | "negotiation"
  | "won"
  | "lost";

export type LeadPriority = "low" | "medium" | "high" | "urgent";

export type ActivityType =
  | "call"
  | "meeting"
  | "email"
  | "whatsapp"
  | "note"
  | "status_change"
  | "follow_up"
  | "other";

export interface Company {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyInsert {
  id?: string;
  name: string;
  website?: string | null;
  industry?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postal_code?: string | null;
  notes?: string | null;
  created_by?: string;
}

export interface CompanyUpdate {
  id?: string;
  name?: string;
  website?: string | null;
  industry?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postal_code?: string | null;
  notes?: string | null;
}

export interface Contact {
  id: string;
  company_id: string | null;
  first_name: string;
  last_name: string | null;
  job_title: string | null;
  email: string | null;
  phone: string | null;
  alternate_phone: string | null;
  linkedin_url: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ContactInsert {
  id?: string;
  company_id?: string | null;
  first_name: string;
  last_name?: string | null;
  job_title?: string | null;
  email?: string | null;
  phone?: string | null;
  alternate_phone?: string | null;
  linkedin_url?: string | null;
  notes?: string | null;
  created_by?: string;
}

export interface ContactUpdate {
  id?: string;
  company_id?: string | null;
  first_name?: string;
  last_name?: string | null;
  job_title?: string | null;
  email?: string | null;
  phone?: string | null;
  alternate_phone?: string | null;
  linkedin_url?: string | null;
  notes?: string | null;
}

export interface LeadSource {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  company_id: string | null;
  contact_id: string | null;
  title: string;
  description: string | null;
  source_id: string | null;
  assigned_to: string | null;
  status: LeadStatus;
  priority: LeadPriority;
  estimated_value: number | null;
  currency: string;
  next_follow_up_at: string | null;
  last_contacted_at: string | null;
  lost_reason: string | null;
  archived_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface LeadInsert {
  id?: string;
  company_id?: string | null;
  contact_id?: string | null;
  title: string;
  description?: string | null;
  source_id?: string | null;
  assigned_to?: string | null;
  status?: LeadStatus;
  priority?: LeadPriority;
  estimated_value?: number | null;
  currency?: string;
  next_follow_up_at?: string | null;
  last_contacted_at?: string | null;
  lost_reason?: string | null;
  archived_at?: string | null;
  created_by?: string;
}

export interface LeadUpdate {
  id?: string;
  company_id?: string | null;
  contact_id?: string | null;
  title?: string;
  description?: string | null;
  source_id?: string | null;
  assigned_to?: string | null;
  status?: LeadStatus;
  priority?: LeadPriority;
  estimated_value?: number | null;
  currency?: string;
  next_follow_up_at?: string | null;
  last_contacted_at?: string | null;
  lost_reason?: string | null;
  archived_at?: string | null;
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  user_id: string;
  activity_type: ActivityType;
  subject: string | null;
  description: string | null;
  created_at: string;
}

export interface LeadActivityInsert {
  id?: string;
  lead_id: string;
  user_id: string;
  activity_type: ActivityType;
  subject?: string | null;
  description?: string | null;
}

export interface LeadNote {
  id: string;
  lead_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface LeadNoteInsert {
  id?: string;
  lead_id: string;
  user_id: string;
  content: string;
}

// ──────────────────────────────────────────────
// UI-specific types
// ──────────────────────────────────────────────

export interface LeadWithRelations extends Lead {
  company: Pick<Company, "id" | "name" | "website" | "phone" | "email" | "city" | "country"> | null;
  contact: Pick<Contact, "id" | "first_name" | "last_name" | "email" | "phone" | "job_title" | "linkedin_url"> | null;
  assigned_user: { id: string; full_name: string | null; email: string } | null;
  source: Pick<LeadSource, "id" | "name"> | null;
}

export interface LeadFilters {
  search?: string;
  status?: LeadStatus[];
  priority?: LeadPriority[];
  assigned_to?: string;
  source_id?: string;
  archived?: boolean;
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PipelineStageData {
  status: LeadStatus;
  label: string;
  count: number;
  leads: LeadWithRelations[];
  color: string;
}

export const LEAD_STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; bgColor: string }> = {
  new: { label: "New", color: "text-blue-600", bgColor: "bg-blue-500" },
  contacted: { label: "Contacted", color: "text-violet-600", bgColor: "bg-violet-500" },
  interested: { label: "Interested", color: "text-amber-600", bgColor: "bg-amber-500" },
  meeting: { label: "Meeting", color: "text-orange-600", bgColor: "bg-orange-500" },
  proposal: { label: "Proposal", color: "text-emerald-600", bgColor: "bg-emerald-500" },
  negotiation: { label: "Negotiation", color: "text-teal-600", bgColor: "bg-teal-500" },
  won: { label: "Won", color: "text-green-600", bgColor: "bg-green-500" },
  lost: { label: "Lost", color: "text-red-600", bgColor: "bg-red-500" },
};

export const LEAD_PRIORITY_CONFIG: Record<LeadPriority, { label: string; color: string }> = {
  low: { label: "Low", color: "text-muted-foreground" },
  medium: { label: "Medium", color: "text-blue-600" },
  high: { label: "High", color: "text-orange-600" },
  urgent: { label: "Urgent", color: "text-red-600" },
};

export const ACTIVITY_TYPE_CONFIG: Record<ActivityType, { label: string }> = {
  call: { label: "Call" },
  meeting: { label: "Meeting" },
  email: { label: "Email" },
  whatsapp: { label: "WhatsApp" },
  note: { label: "Note" },
  status_change: { label: "Status Change" },
  follow_up: { label: "Follow Up" },
  other: { label: "Other" },
};
