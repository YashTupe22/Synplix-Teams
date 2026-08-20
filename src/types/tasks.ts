export type TaskStatus = "todo" | "in_progress" | "in_review" | "blocked" | "completed" | "cancelled";

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  project_id: string;
  milestone_id: string | null;
  title: string;
  description: string | null;
  assigned_to: string | null;
  created_by: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskInsert {
  id?: string;
  project_id: string;
  milestone_id?: string | null;
  title: string;
  description?: string | null;
  assigned_to?: string | null;
  created_by: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
  completed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface TaskUpdate {
  project_id?: string;
  milestone_id?: string | null;
  title?: string;
  description?: string | null;
  assigned_to?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
  completed_at?: string | null;
}

export interface TaskWithRelations extends Task {
  project?: {
    id: string;
    name: string;
    project_code: string;
    status: string;
  };
  milestone?: {
    id: string;
    name: string;
    status: string;
  } | null;
  assignee?: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
  creator?: {
    id: string;
    full_name: string | null;
    email: string;
  };
}

export interface TaskComment {
  id: string;
  task_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface TaskCommentInsert {
  id?: string;
  task_id: string;
  author_id: string;
  content: string;
  created_at?: string;
  updated_at?: string;
}

export interface TaskCommentUpdate {
  content?: string;
}

export interface TaskCommentWithRelations extends TaskComment {
  author?: {
    id: string;
    full_name: string | null;
    email: string;
  };
}

export const TASK_STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bgColor: string }> = {
  todo: { label: "To Do", color: "text-gray-600", bgColor: "bg-gray-100" },
  in_progress: { label: "In Progress", color: "text-blue-600", bgColor: "bg-blue-100" },
  in_review: { label: "In Review", color: "text-purple-600", bgColor: "bg-purple-100" },
  blocked: { label: "Blocked", color: "text-red-600", bgColor: "bg-red-100" },
  completed: { label: "Completed", color: "text-green-600", bgColor: "bg-green-100" },
  cancelled: { label: "Cancelled", color: "text-muted-foreground", bgColor: "bg-muted" },
};

export const TASK_PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bgColor: string }> = {
  low: { label: "Low", color: "text-gray-600", bgColor: "bg-gray-100" },
  medium: { label: "Medium", color: "text-yellow-600", bgColor: "bg-yellow-100" },
  high: { label: "High", color: "text-orange-600", bgColor: "bg-orange-100" },
  urgent: { label: "Urgent", color: "text-red-600", bgColor: "bg-red-100" },
};

export interface TaskFilters {
  search?: string;
  status?: TaskStatus[];
  priority?: TaskPriority[];
  project_id?: string;
  milestone_id?: string;
  assigned_to?: string;
  created_by?: string;
  due_before?: string;
  due_after?: string;
  overdue?: boolean;
  page?: number;
  limit?: number;
}

export interface TaskMetrics {
  total: number;
  todo: number;
  inProgress: number;
  inReview: number;
  blocked: number;
  completed: number;
  cancelled: number;
  overdue: number;
  dueToday: number;
  dueThisWeek: number;
}
