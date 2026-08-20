import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/authorization-server";
import { Permission } from "@/lib/authorization";
import {
  notifyTaskAssigned,
  notifyTaskReassigned,
  notifyTaskCompleted,
  notifyCommentAdded,
} from "@/services/notification-integrations";
import {
  TaskInsert,
  TaskUpdate,
  TaskWithRelations,
  TaskCommentInsert,
  TaskCommentWithRelations,
  TaskFilters,
  TaskMetrics,
} from "@/types/tasks";
import { PaginatedResult } from "@/types/clients";

export async function getTasks(
  filters: TaskFilters = {}
): Promise<PaginatedResult<TaskWithRelations>> {
  await requirePermission(Permission.TASKS_VIEW);

  const supabase = await createClient();

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("tasks")
    .select(
      `
      *,
      project:projects!tasks_project_id_fkey(id, name, project_code, status),
      milestone:project_milestones!tasks_milestone_id_fkey(id, name, status),
      assignee:profiles!tasks_assigned_to_fkey(id, full_name, email),
      creator:profiles!tasks_created_by_fkey(id, full_name, email)
    `,
      { count: "exact" }
    );

  // RLS handles role-based filtering automatically
  // No application-level role filtering needed

  // Filters
  if (filters.search) {
    query = query.ilike("title", `%${filters.search}%`);
  }

  if (filters.status && filters.status.length > 0) {
    query = query.in("status", filters.status);
  }

  if (filters.priority && filters.priority.length > 0) {
    query = query.in("priority", filters.priority);
  }

  if (filters.project_id) {
    query = query.eq("project_id", filters.project_id);
  }

  if (filters.milestone_id) {
    query = query.eq("milestone_id", filters.milestone_id);
  }

  if (filters.assigned_to) {
    query = query.eq("assigned_to", filters.assigned_to);
  }

  if (filters.created_by) {
    query = query.eq("created_by", filters.created_by);
  }

  if (filters.due_before) {
    query = query.lte("due_date", filters.due_before);
  }

  if (filters.due_after) {
    query = query.gte("due_date", filters.due_after);
  }

  if (filters.overdue) {
    const today = new Date().toISOString().split("T")[0];
    query = query.lt("due_date", today).not("status", "in", "completed,cancelled");
  }

  // Sorting - default: overdue first, then due soon, then priority
  query = query.order("due_date", { ascending: true, nullsFirst: false });
  query = query.order("created_at", { ascending: false });

  // Pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) throw error;

  const total = count || 0;
  return {
    data: (data as TaskWithRelations[]) || [],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getTasksByProject(
  projectId: string,
  filters: TaskFilters = {}
): Promise<PaginatedResult<TaskWithRelations>> {
  await requirePermission(Permission.TASKS_VIEW);

  const supabase = await createClient();
  const page = filters.page || 1;
  const limit = filters.limit || 50;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("tasks")
    .select(
      `
      *,
      milestone:project_milestones!tasks_milestone_id_fkey(id, name, status),
      assignee:profiles!tasks_assigned_to_fkey(id, full_name, email),
      creator:profiles!tasks_created_by_fkey(id, full_name, email)
    `,
      { count: "exact" }
    )
    .eq("project_id", projectId);

  if (filters.status && filters.status.length > 0) {
    query = query.in("status", filters.status);
  }

  if (filters.milestone_id) {
    query = query.eq("milestone_id", filters.milestone_id);
  }

  query = query.order("due_date", { ascending: true, nullsFirst: false });
  query = query.order("created_at", { ascending: false });
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) throw error;

  const total = count || 0;
  return {
    data: (data as TaskWithRelations[]) || [],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getTaskById(
  id: string
): Promise<TaskWithRelations | null> {
  await requirePermission(Permission.TASKS_VIEW);

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tasks")
    .select(
      `
      *,
      project:projects!tasks_project_id_fkey(id, name, project_code, status),
      milestone:project_milestones!tasks_milestone_id_fkey(id, name, status),
      assignee:profiles!tasks_assigned_to_fkey(id, full_name, email),
      creator:profiles!tasks_created_by_fkey(id, full_name, email)
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return data as TaskWithRelations;
}

export async function createTask(
  task: TaskInsert
): Promise<TaskWithRelations> {
  const profile = await requirePermission(Permission.TASKS_MANAGE);

  const supabase = await createClient();

  // Validate milestone belongs to the same project
  if (task.milestone_id) {
    const { data: milestone } = await supabase
      .from("project_milestones")
      .select("id, project_id")
      .eq("id", task.milestone_id)
      .single();

    if (!milestone || milestone.project_id !== task.project_id) {
      throw new Error("Milestone does not belong to this project");
    }
  }

  // Validate assignee is a project member or authorized
  if (task.assigned_to) {
    const { data: isMember } = await supabase
      .from("project_members")
      .select("id")
      .eq("project_id", task.project_id)
      .eq("user_id", task.assigned_to)
      .single();

    if (!isMember) {
      // Check if assignee is the project manager
      const { data: project } = await supabase
        .from("projects")
        .select("project_manager_id")
        .eq("id", task.project_id)
        .single();

      if (project?.project_manager_id !== task.assigned_to) {
        throw new Error("User is not a member of this project");
      }
    }
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      ...task,
      created_by: profile.id,
      status: task.status || "todo",
      priority: task.priority || "medium",
    })
    .select(
      `
      *,
      project:projects!tasks_project_id_fkey(id, name, project_code, status),
      milestone:project_milestones!tasks_milestone_id_fkey(id, name, status),
      assignee:profiles!tasks_assigned_to_fkey(id, full_name, email),
      creator:profiles!tasks_created_by_fkey(id, full_name, email)
    `
    )
    .single();

  if (error) throw error;

  // Audit log
  await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    actor_email: profile.email,
    action: "task_created",
    target_id: data.id,
    metadata: {
      title: data.title,
      project_id: data.project_id,
      assigned_to: data.assigned_to,
    },
  });

  // Send notification if task is assigned
  if (data.assigned_to) {
    await notifyTaskAssigned(
      profile.id,
      data.id,
      data.title,
      data.assigned_to,
      data.project_id
    ).catch(() => {}); // Non-blocking
  }

  return data as TaskWithRelations;
}

export async function updateTask(
  id: string,
  updates: TaskUpdate
): Promise<TaskWithRelations> {
  const profile = await requirePermission(Permission.TASKS_MANAGE);

  const supabase = await createClient();

  // Get current task
  const { data: current } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .single();

  if (!current) throw new Error("Task not found");

  // Validate milestone belongs to same project if changing
  if (updates.milestone_id && updates.milestone_id !== current.milestone_id) {
    const { data: milestone } = await supabase
      .from("project_milestones")
      .select("id, project_id")
      .eq("id", updates.milestone_id)
      .single();

    const projectId = updates.project_id || current.project_id;
    if (!milestone || milestone.project_id !== projectId) {
      throw new Error("Milestone does not belong to this project");
    }
  }

  // Validate assignee if changing
  if (updates.assigned_to && updates.assigned_to !== current.assigned_to) {
    const projectId = updates.project_id || current.project_id;
    const { data: isMember } = await supabase
      .from("project_members")
      .select("id")
      .eq("project_id", projectId)
      .eq("user_id", updates.assigned_to)
      .single();

    if (!isMember) {
      const { data: project } = await supabase
        .from("projects")
        .select("project_manager_id")
        .eq("id", projectId)
        .single();

      if (project?.project_manager_id !== updates.assigned_to) {
        throw new Error("User is not a member of this project");
      }
    }
  }

  // Handle completion
  if (updates.status === "completed" && current.status !== "completed") {
    updates.completed_at = new Date().toISOString();
  } else if (
    updates.status &&
    updates.status !== "completed" &&
    current.status === "completed"
  ) {
    updates.completed_at = null;
  }

  const { data, error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", id)
    .select(
      `
      *,
      project:projects!tasks_project_id_fkey(id, name, project_code, status),
      milestone:project_milestones!tasks_milestone_id_fkey(id, name, status),
      assignee:profiles!tasks_assigned_to_fkey(id, full_name, email),
      creator:profiles!tasks_created_by_fkey(id, full_name, email)
    `
    )
    .single();

  if (error) throw error;

  // Audit log
  const auditMetadata: Record<string, unknown> = { title: data.title };

  if (updates.status && updates.status !== current.status) {
    auditMetadata.old_status = current.status;
    auditMetadata.new_status = updates.status;
    await supabase.from("audit_logs").insert({
      actor_id: profile.id,
      actor_email: profile.email,
      action: updates.status === "completed" ? "task_completed" : "task_status_changed",
      target_id: data.id,
      metadata: auditMetadata,
    });
  }

  if (updates.assigned_to && updates.assigned_to !== current.assigned_to) {
    await supabase.from("audit_logs").insert({
      actor_id: profile.id,
      actor_email: profile.email,
      action: "task_assigned",
      target_id: data.id,
      metadata: { ...auditMetadata, old_assignee: current.assigned_to, new_assignee: updates.assigned_to },
    });
  }

  if (updates.priority && updates.priority !== current.priority) {
    await supabase.from("audit_logs").insert({
      actor_id: profile.id,
      actor_email: profile.email,
      action: "task_priority_changed",
      target_id: data.id,
      metadata: { ...auditMetadata, old_priority: current.priority, new_priority: updates.priority },
    });
  }

  if (updates.due_date !== undefined && updates.due_date !== current.due_date) {
    await supabase.from("audit_logs").insert({
      actor_id: profile.id,
      actor_email: profile.email,
      action: "task_due_date_changed",
      target_id: data.id,
      metadata: { ...auditMetadata, old_due_date: current.due_date, new_due_date: updates.due_date },
    });
  }

  // Send notifications
  if (updates.assigned_to && updates.assigned_to !== current.assigned_to) {
    await notifyTaskReassigned(
      profile.id,
      data.id,
      data.title,
      updates.assigned_to,
      data.project_id
    ).catch(() => {});
  }

  if (updates.status === "completed" && current.status !== "completed") {
    await notifyTaskCompleted(
      profile.id,
      data.id,
      data.title,
      data.project_id,
      current.created_by
    ).catch(() => {});
  }

  return data as TaskWithRelations;
}

export async function deleteTask(id: string): Promise<void> {
  const profile = await requirePermission(Permission.TASKS_MANAGE);

  const supabase = await createClient();

  const { data: task } = await supabase
    .from("tasks")
    .select("id, title")
    .eq("id", id)
    .single();

  if (!task) throw new Error("Task not found");

  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;

  await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    actor_email: profile.email,
    action: "task_deleted",
    target_id: id,
    metadata: { title: task.title },
  });
}

// ============================================================
// COMMENTS
// ============================================================

export async function getTaskComments(
  taskId: string
): Promise<TaskCommentWithRelations[]> {
  await requirePermission(Permission.TASKS_VIEW);

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("task_comments")
    .select(
      `
      *,
      author:profiles!task_comments_author_id_fkey(id, full_name, email)
    `
    )
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data as TaskCommentWithRelations[]) || [];
}

export async function createTaskComment(
  comment: TaskCommentInsert
): Promise<TaskCommentWithRelations> {
  const profile = await requirePermission(Permission.TASKS_VIEW);

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("task_comments")
    .insert({
      ...comment,
      author_id: profile.id,
    })
    .select(
      `
      *,
      author:profiles!task_comments_author_id_fkey(id, full_name, email)
    `
    )
    .single();

  if (error) throw error;

  // Audit log
  await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    actor_email: profile.email,
    action: "comment_created",
    target_id: data.id,
    metadata: { task_id: comment.task_id, content_preview: comment.content.substring(0, 100) },
  });

  // Send comment notification
  const { data: task } = await supabase
    .from("tasks")
    .select("title")
    .eq("id", comment.task_id)
    .single();

  if (task) {
    await notifyCommentAdded(
      profile.id,
      comment.task_id,
      task.title,
      comment.content
    ).catch(() => {});
  }

  return data as TaskCommentWithRelations;
}

export async function updateTaskComment(
  id: string,
  content: string
): Promise<TaskCommentWithRelations> {
  const profile = await requirePermission(Permission.TASKS_VIEW);

  const supabase = await createClient();

  // Verify ownership
  const { data: existing } = await supabase
    .from("task_comments")
    .select("author_id")
    .eq("id", id)
    .single();

  if (!existing) throw new Error("Comment not found");
  if (existing.author_id !== profile.id) {
    throw new Error("You can only edit your own comments");
  }

  const { data, error } = await supabase
    .from("task_comments")
    .update({ content })
    .eq("id", id)
    .select(
      `
      *,
      author:profiles!task_comments_author_id_fkey(id, full_name, email)
    `
    )
    .single();

  if (error) throw error;

  return data as TaskCommentWithRelations;
}

export async function deleteTaskComment(id: string): Promise<void> {
  const profile = await requirePermission(Permission.TASKS_VIEW);

  const supabase = await createClient();

  // Verify ownership or admin/manager
  const { data: existing } = await supabase
    .from("task_comments")
    .select("author_id")
    .eq("id", id)
    .single();

  if (!existing) throw new Error("Comment not found");

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", profile.id)
    .single();

  if (existing.author_id !== profile.id && currentProfile?.role === "employee") {
    throw new Error("You can only delete your own comments");
  }

  const { error } = await supabase.from("task_comments").delete().eq("id", id);
  if (error) throw error;
}

// ============================================================
// METRICS
// ============================================================

export async function getTaskMetrics(
  projectId?: string,
  assignedTo?: string
): Promise<TaskMetrics> {
  await requirePermission(Permission.TASKS_VIEW);

  const supabase = await createClient();

  let query = supabase.from("tasks").select("id, status, due_date");

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  if (assignedTo) {
    query = query.eq("assigned_to", assignedTo);
  }

  const { data: tasks, error } = await query;

  if (error) throw error;

  const today = new Date().toISOString().split("T")[0];
  const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const allTasks = tasks || [];
  const activeTasks = allTasks.filter(
    (t) => t.status !== "completed" && t.status !== "cancelled"
  );

  return {
    total: allTasks.length,
    todo: allTasks.filter((t) => t.status === "todo").length,
    inProgress: allTasks.filter((t) => t.status === "in_progress").length,
    inReview: allTasks.filter((t) => t.status === "in_review").length,
    blocked: allTasks.filter((t) => t.status === "blocked").length,
    completed: allTasks.filter((t) => t.status === "completed").length,
    cancelled: allTasks.filter((t) => t.status === "cancelled").length,
    overdue: activeTasks.filter((t) => t.due_date && t.due_date < today).length,
    dueToday: activeTasks.filter((t) => t.due_date === today).length,
    dueThisWeek: activeTasks.filter(
      (t) => t.due_date && t.due_date >= today && t.due_date <= weekFromNow
    ).length,
  };
}

export async function getTeamTaskMetrics(): Promise<
  Array<{
    user_id: string;
    full_name: string | null;
    email: string;
    total: number;
    overdue: number;
    completed: number;
    inProgress: number;
  }>
> {
  await requirePermission(Permission.TASKS_MANAGE);

  const supabase = await createClient();

  // Get all tasks with assignee
  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("id, assigned_to, status, due_date");

  if (error) throw error;

  const today = new Date().toISOString().split("T")[0];
  const allTasks = (tasks || []) as Array<{
    id: string;
    assigned_to: string | null;
    status: string;
    due_date: string | null;
  }>;

  // Get unique assignee IDs
  const assigneeIds = [...new Set(allTasks.filter((t) => t.assigned_to).map((t) => t.assigned_to!))];

  // Fetch assignee profiles
  const { data: assignees } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", assigneeIds);

  const assigneeMap = new Map(
    (assignees || []).map((a) => [a.id, { full_name: a.full_name, email: a.email }])
  );

  const userMap = new Map<
    string,
    {
      user_id: string;
      full_name: string | null;
      email: string;
      total: number;
      overdue: number;
      completed: number;
      inProgress: number;
    }
  >();

  for (const task of allTasks) {
    if (!task.assigned_to) continue;

    const assignee = assigneeMap.get(task.assigned_to);
    if (!assignee) continue;

    if (!userMap.has(task.assigned_to)) {
      userMap.set(task.assigned_to, {
        user_id: task.assigned_to,
        full_name: assignee.full_name,
        email: assignee.email,
        total: 0,
        overdue: 0,
        completed: 0,
        inProgress: 0,
      });
    }

    const stats = userMap.get(task.assigned_to)!;
    stats.total++;

    if (task.status === "completed") {
      stats.completed++;
    } else if (task.status === "in_progress") {
      stats.inProgress++;
    }

    if (
      task.due_date &&
      task.due_date < today &&
      task.status !== "completed" &&
      task.status !== "cancelled"
    ) {
      stats.overdue++;
    }
  }

  return Array.from(userMap.values());
}
