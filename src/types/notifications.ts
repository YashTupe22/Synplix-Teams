// ──────────────────────────────────────────────
// Notification Types
// ──────────────────────────────────────────────

export type NotificationType =
  | "TASK_ASSIGNED"
  | "TASK_REASSIGNED"
  | "TASK_COMPLETED"
  | "TASK_OVERDUE"
  | "TASK_DUE_SOON"
  | "COMMENT_ADDED"
  | "COMMENT_MENTION"
  | "PROJECT_UPDATED"
  | "MILESTONE_UPDATED"
  | "MILESTONE_COMPLETED"
  | "LEAD_ASSIGNED"
  | "LEAD_UPDATED"
  | "OPPORTUNITY_UPDATED"
  | "OPPORTUNITY_WON"
  | "QUOTATION_ACCEPTED"
  | "QUOTATION_REJECTED"
  | "INVOICE_CREATED"
  | "INVOICE_OVERDUE"
  | "PAYMENT_RECEIVED";

export type EntityType =
  | "task"
  | "project"
  | "milestone"
  | "lead"
  | "opportunity"
  | "quotation"
  | "invoice"
  | "payment"
  | "comment";

// ──────────────────────────────────────────────
// Core entities
// ──────────────────────────────────────────────

export interface Notification {
  id: string;
  recipient_id: string;
  actor_id: string | null;
  type: NotificationType;
  title: string;
  message: string;
  entity_type: EntityType | null;
  entity_id: string | null;
  action_url: string | null;
  is_read: boolean;
  read_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface NotificationInsert {
  id?: string;
  recipient_id: string;
  actor_id?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  entity_type?: EntityType | null;
  entity_id?: string | null;
  action_url?: string | null;
  is_read?: boolean;
  read_at?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
}

export interface NotificationWithRelations extends Notification {
  actor?: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
}

// ──────────────────────────────────────────────
// Notification Preferences
// ──────────────────────────────────────────────

export interface NotificationPreferences {
  id: string;
  user_id: string;
  task_notifications: boolean;
  project_notifications: boolean;
  sales_notifications: boolean;
  client_notifications: boolean;
  finance_notifications: boolean;
  comment_notifications: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferencesUpdate {
  task_notifications?: boolean;
  project_notifications?: boolean;
  sales_notifications?: boolean;
  client_notifications?: boolean;
  finance_notifications?: boolean;
  comment_notifications?: boolean;
}

// ──────────────────────────────────────────────
// Filters
// ──────────────────────────────────────────────

export type NotificationFilterType = "all" | "unread" | "tasks" | "projects" | "sales" | "finance" | "comments";

export interface NotificationFilters {
  filter?: NotificationFilterType;
  page?: number;
  limit?: number;
}

// ──────────────────────────────────────────────
// Config constants
// ──────────────────────────────────────────────

export const NOTIFICATION_TYPE_CONFIG: Record<NotificationType, { label: string; category: string }> = {
  TASK_ASSIGNED: { label: "Task Assigned", category: "tasks" },
  TASK_REASSIGNED: { label: "Task Reassigned", category: "tasks" },
  TASK_COMPLETED: { label: "Task Completed", category: "tasks" },
  TASK_OVERDUE: { label: "Task Overdue", category: "tasks" },
  TASK_DUE_SOON: { label: "Task Due Soon", category: "tasks" },
  COMMENT_ADDED: { label: "Comment Added", category: "comments" },
  COMMENT_MENTION: { label: "Mentioned in Comment", category: "comments" },
  PROJECT_UPDATED: { label: "Project Updated", category: "projects" },
  MILESTONE_UPDATED: { label: "Milestone Updated", category: "projects" },
  MILESTONE_COMPLETED: { label: "Milestone Completed", category: "projects" },
  LEAD_ASSIGNED: { label: "Lead Assigned", category: "sales" },
  LEAD_UPDATED: { label: "Lead Updated", category: "sales" },
  OPPORTUNITY_UPDATED: { label: "Opportunity Updated", category: "sales" },
  OPPORTUNITY_WON: { label: "Opportunity Won", category: "sales" },
  QUOTATION_ACCEPTED: { label: "Quotation Accepted", category: "finance" },
  QUOTATION_REJECTED: { label: "Quotation Rejected", category: "finance" },
  INVOICE_CREATED: { label: "Invoice Created", category: "finance" },
  INVOICE_OVERDUE: { label: "Invoice Overdue", category: "finance" },
  PAYMENT_RECEIVED: { label: "Payment Received", category: "finance" },
};

export const NOTIFICATION_FILTER_OPTIONS: { value: NotificationFilterType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "tasks", label: "Tasks" },
  { value: "projects", label: "Projects" },
  { value: "sales", label: "Sales" },
  { value: "finance", label: "Finance" },
  { value: "comments", label: "Comments" },
];

// Category → notification type mapping for filtering
export const CATEGORY_TYPES: Record<string, NotificationType[]> = {
  tasks: ["TASK_ASSIGNED", "TASK_REASSIGNED", "TASK_COMPLETED", "TASK_OVERDUE", "TASK_DUE_SOON"],
  projects: ["PROJECT_UPDATED", "MILESTONE_UPDATED", "MILESTONE_COMPLETED"],
  sales: ["LEAD_ASSIGNED", "LEAD_UPDATED", "OPPORTUNITY_UPDATED", "OPPORTUNITY_WON"],
  finance: ["QUOTATION_ACCEPTED", "QUOTATION_REJECTED", "INVOICE_CREATED", "INVOICE_OVERDUE", "PAYMENT_RECEIVED"],
  comments: ["COMMENT_ADDED", "COMMENT_MENTION"],
};

// ──────────────────────────────────────────────
// Preference category config
// ──────────────────────────────────────────────

export const PREFERENCE_CATEGORIES = [
  { key: "task_notifications" as const, label: "Tasks", description: "Task assignments, completions, and due dates" },
  { key: "project_notifications" as const, label: "Projects", description: "Project and milestone updates" },
  { key: "sales_notifications" as const, label: "Sales", description: "Leads, opportunities, and follow-ups" },
  { key: "client_notifications" as const, label: "Clients", description: "Client-related notifications" },
  { key: "finance_notifications" as const, label: "Finance", description: "Invoices, quotations, and payments" },
  { key: "comment_notifications" as const, label: "Comments", description: "Comment mentions and replies" },
];

// ──────────────────────────────────────────────
// Utility: Map notification type → action URL
// ──────────────────────────────────────────────

export function getNotificationUrl(notification: Notification): string | null {
  if (notification.action_url) return notification.action_url;
  if (!notification.entity_type || !notification.entity_id) return null;

  const entityRoutes: Record<EntityType, string> = {
    task: "/tasks",
    project: "/projects",
    milestone: "/projects",
    lead: "/crm/leads",
    opportunity: "/sales/opportunities",
    quotation: "/finance/quotations",
    invoice: "/finance/invoices",
    payment: "/finance/payments",
    comment: "/tasks",
  };

  const base = entityRoutes[notification.entity_type];
  return base ? `${base}/${notification.entity_id}` : null;
}

// ──────────────────────────────────────────────
// Utility: Relative timestamp
// ──────────────────────────────────────────────

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}
