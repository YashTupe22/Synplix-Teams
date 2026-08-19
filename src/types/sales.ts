import type { Lead, Company, Contact } from "@/types/crm";

// ──────────────────────────────────────────────
// Enums / Types
// ──────────────────────────────────────────────

export type SalesStage =
  | "qualification"
  | "discovery"
  | "meeting"
  | "proposal"
  | "negotiation"
  | "closed_won"
  | "closed_lost";

export type CallOutcome =
  | "connected"
  | "no_answer"
  | "busy"
  | "callback_requested"
  | "interested"
  | "not_interested"
  | "wrong_number"
  | "follow_up_required"
  | "meeting_booked"
  | "other";

export type FollowUpType = "call" | "meeting" | "email" | "whatsapp" | "other";

export type FollowUpStatus = "pending" | "completed" | "cancelled" | "missed";

// ──────────────────────────────────────────────
// Core entities
// ──────────────────────────────────────────────

export interface SalesOpportunity {
  id: string;
  lead_id: string;
  owner_id: string;
  title: string;
  value: number;
  currency: string;
  stage: SalesStage;
  probability: number;
  expected_close_date: string | null;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  lost_reason: string | null;
}

export interface SalesOpportunityInsert {
  id?: string;
  lead_id: string;
  owner_id?: string;
  title: string;
  value?: number;
  currency?: string;
  stage?: SalesStage;
  probability?: number;
  expected_close_date?: string | null;
  description?: string | null;
  created_by?: string;
  lost_reason?: string | null;
}

export interface SalesOpportunityUpdate {
  lead_id?: string;
  owner_id?: string;
  title?: string;
  value?: number;
  currency?: string;
  stage?: SalesStage;
  probability?: number;
  expected_close_date?: string | null;
  description?: string | null;
  lost_reason?: string | null;
}

export interface SalesCall {
  id: string;
  lead_id: string;
  contact_id: string | null;
  user_id: string;
  started_at: string;
  duration_seconds: number | null;
  outcome: CallOutcome;
  notes: string | null;
  created_at: string;
}

export interface SalesCallInsert {
  id?: string;
  lead_id: string;
  contact_id?: string | null;
  user_id?: string;
  started_at?: string;
  duration_seconds?: number | null;
  outcome: CallOutcome;
  notes?: string | null;
}

export interface SalesFollowUp {
  id: string;
  lead_id: string;
  assigned_to: string;
  type: FollowUpType;
  title: string;
  description: string | null;
  scheduled_at: string;
  status: FollowUpStatus;
  completed_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface SalesFollowUpInsert {
  id?: string;
  lead_id: string;
  assigned_to: string;
  type: FollowUpType;
  title: string;
  description?: string | null;
  scheduled_at: string;
  status?: FollowUpStatus;
  completed_at?: string | null;
  created_by?: string;
}

export interface SalesFollowUpUpdate {
  assigned_to?: string;
  type?: FollowUpType;
  title?: string;
  description?: string | null;
  scheduled_at?: string;
  status?: FollowUpStatus;
  completed_at?: string | null;
}

// ──────────────────────────────────────────────
// UI-specific types (with relations)
// ──────────────────────────────────────────────

export interface OpportunityWithRelations extends SalesOpportunity {
  lead: Pick<Lead, "id" | "title" | "status" | "company_id" | "contact_id"> | null;
  owner: { id: string; full_name: string | null; email: string } | null;
  lead_company: Pick<Company, "id" | "name"> | null;
  lead_contact: Pick<Contact, "id" | "first_name" | "last_name" | "email" | "phone"> | null;
}

export interface CallWithRelations extends SalesCall {
  lead: Pick<Lead, "id" | "title"> | null;
  contact: Pick<Contact, "id" | "first_name" | "last_name"> | null;
  user: { id: string; full_name: string | null; email: string } | null;
}

export interface FollowUpWithRelations extends SalesFollowUp {
  lead: Pick<Lead, "id" | "title"> | null;
  lead_company: Pick<Company, "id" | "name"> | null;
  lead_contact: Pick<Contact, "id" | "first_name" | "last_name"> | null;
  assigned_user: { id: string; full_name: string | null; email: string } | null;
  created_by_user: { id: string; full_name: string | null; email: string } | null;
}

// ──────────────────────────────────────────────
// Config / constants
// ──────────────────────────────────────────────

export const SALES_STAGE_CONFIG: Record<SalesStage, { label: string; color: string; bgColor: string; probability: number }> = {
  qualification: { label: "Qualification", color: "text-blue-600", bgColor: "bg-blue-500", probability: 10 },
  discovery: { label: "Discovery", color: "text-violet-600", bgColor: "bg-violet-500", probability: 25 },
  meeting: { label: "Meeting", color: "text-amber-600", bgColor: "bg-amber-500", probability: 40 },
  proposal: { label: "Proposal", color: "text-orange-600", bgColor: "bg-orange-500", probability: 60 },
  negotiation: { label: "Negotiation", color: "text-teal-600", bgColor: "bg-teal-500", probability: 80 },
  closed_won: { label: "Closed Won", color: "text-green-600", bgColor: "bg-green-500", probability: 100 },
  closed_lost: { label: "Closed Lost", color: "text-red-600", bgColor: "bg-red-500", probability: 0 },
};

export const OPEN_STAGES: SalesStage[] = ["qualification", "discovery", "meeting", "proposal", "negotiation"];

export const CALL_OUTCOME_CONFIG: Record<CallOutcome, { label: string; color: string }> = {
  connected: { label: "Connected", color: "text-green-600" },
  no_answer: { label: "No Answer", color: "text-muted-foreground" },
  busy: { label: "Busy", color: "text-muted-foreground" },
  callback_requested: { label: "Callback Requested", color: "text-blue-600" },
  interested: { label: "Interested", color: "text-green-600" },
  not_interested: { label: "Not Interested", color: "text-red-600" },
  wrong_number: { label: "Wrong Number", color: "text-muted-foreground" },
  follow_up_required: { label: "Follow-up Required", color: "text-amber-600" },
  meeting_booked: { label: "Meeting Booked", color: "text-violet-600" },
  other: { label: "Other", color: "text-muted-foreground" },
};

export const FOLLOW_UP_TYPE_CONFIG: Record<FollowUpType, { label: string }> = {
  call: { label: "Call" },
  meeting: { label: "Meeting" },
  email: { label: "Email" },
  whatsapp: { label: "WhatsApp" },
  other: { label: "Other" },
};

export const FOLLOW_UP_STATUS_CONFIG: Record<FollowUpStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: "Pending", color: "text-blue-600", bgColor: "bg-blue-500" },
  completed: { label: "Completed", color: "text-green-600", bgColor: "bg-green-500" },
  cancelled: { label: "Cancelled", color: "text-muted-foreground", bgColor: "bg-muted" },
  missed: { label: "Missed", color: "text-red-600", bgColor: "bg-red-500" },
};

// ──────────────────────────────────────────────
// Filters & pagination
// ──────────────────────────────────────────────

export interface OpportunityFilters {
  search?: string;
  lead_id?: string;
  stage?: SalesStage[];
  owner_id?: string;
  min_value?: number;
  max_value?: number;
  expected_close_from?: string;
  expected_close_to?: string;
  page?: number;
  limit?: number;
}

export interface FollowUpFilters {
  search?: string;
  lead_id?: string;
  assigned_to?: string;
  type?: FollowUpType[];
  status?: FollowUpStatus[];
  date_from?: string;
  date_to?: string;
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

// ──────────────────────────────────────────────
// Metrics
// ──────────────────────────────────────────────

export interface SalesMetrics {
  totalOpen: number;
  pipelineValue: number;
  weightedPipeline: number;
  wonThisMonth: number;
  lostThisMonth: number;
  wonValue: number;
  lostValue: number;
  conversionRate: number;
  callsToday: number;
  followUpsToday: number;
  meetingsToday: number;
  overdueFollowUps: number;
}

export interface SalespersonPerformance {
  userId: string;
  fullName: string | null;
  email: string;
  calls: number;
  meetings: number;
  followUps: number;
  openOpportunities: number;
  wonDeals: number;
  wonValue: number;
  lostDeals: number;
  conversionRate: number;
}
