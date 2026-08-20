import { createClient } from "@/lib/supabase/server";
import { requirePermission, Permission } from "@/lib/authorization-server";
import type { Profile } from "@/types/database";
import { notifyProjectUpdated, notifyMilestoneUpdated } from "@/services/notification-integrations";
import type {
  Project,
  ProjectInsert,
  ProjectUpdate,
  ProjectMember,
  ProjectMemberInsert,
  ProjectMilestone,
  ProjectMilestoneInsert,
  ProjectMilestoneUpdate,
  ProjectWithRelations,
  ProjectMemberWithUser,
  ProjectMilestoneWithStats,
  ProjectFilters,
  PaginatedResult,
} from "@/types/clients";

// ──────────────────────────────────────────────
// PROJECTS
// ──────────────────────────────────────────────

export async function getProjects(
  filters: ProjectFilters = {},
  profile: Profile
): Promise<PaginatedResult<ProjectWithRelations>> {
  await requirePermission(Permission.PROJECTS_VIEW);
  const supabase = await createClient();
  const {
    search,
    client_id,
    status,
    priority,
    project_manager_id,
    page = 1,
    limit = 20,
  } = filters;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("projects")
    .select(
      `*,
       client:clients!projects_client_id_fkey(id, client_code, status, company:companies(id, name)),
       project_manager:profiles!projects_project_manager_id_fkey(id, full_name, email),
       created_by_user:profiles!projects_created_by_fkey(id, full_name, email)`,
      { count: "exact" }
    );

  if (profile.role === "employee") {
    query = query.or(`
      project_manager_id.eq.${profile.id},
      EXISTS (
        SELECT 1 FROM public.project_members pm
        WHERE pm.project_id = projects.id AND pm.user_id = ${profile.id}
      )
    `);
  }

  if (search) {
    query = query.or(`
      name.ilike.%${search}%,
      project_code.ilike.%${search}%,
      client.company.name.ilike.%${search}%,
      project_manager.full_name.ilike.%${search}%
    `);
  }
  if (client_id) {
    query = query.eq("client_id", client_id);
  }
  if (status && status.length > 0) {
    query = query.in("status", status);
  }
  if (priority && priority.length > 0) {
    query = query.in("priority", priority);
  }
  if (project_manager_id) {
    query = query.eq("project_manager_id", project_manager_id);
  }

  query = query.order("created_at", { ascending: false });
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  const enriched = await Promise.all(
    (data ?? []).map(async (project) => {
      const { count: membersCount } = await supabase
        .from("project_members")
        .select("id", { count: "exact" })
        .eq("project_id", project.id);

      const { count: milestonesCompleted } = await supabase
        .from("project_milestones")
        .select("id", { count: "exact" })
        .eq("project_id", project.id)
        .eq("status", "completed");

      const { count: milestonesTotal } = await supabase
        .from("project_milestones")
        .select("id", { count: "exact" })
        .eq("project_id", project.id);

      return {
        ...project,
        members_count: membersCount ?? 0,
        milestones_completed: milestonesCompleted ?? 0,
        milestones_total: milestonesTotal ?? 0,
      };
    })
  );

  return {
    data: enriched as unknown as ProjectWithRelations[],
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}

export async function getProjectById(id: string): Promise<ProjectWithRelations | null> {
  await requirePermission(Permission.PROJECTS_VIEW);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projects")
    .select(
      `*,
       client:clients!projects_client_id_fkey(id, client_code, status, company:companies(id, name)),
       project_manager:profiles!projects_project_manager_id_fkey(id, full_name, email),
       created_by_user:profiles!projects_created_by_fkey(id, full_name, email)`
    )
    .eq("id", id)
    .single();

  if (error || !data) return null;

  const { count: membersCount } = await supabase
    .from("project_members")
    .select("id", { count: "exact" })
    .eq("project_id", id);

  const { count: milestonesCompleted } = await supabase
    .from("project_milestones")
    .select("id", { count: "exact" })
    .eq("project_id", id)
    .eq("status", "completed");

  const { count: milestonesTotal } = await supabase
    .from("project_milestones")
    .select("id", { count: "exact" })
    .eq("project_id", id);

  return {
    ...data,
    members_count: membersCount ?? 0,
    milestones_completed: milestonesCompleted ?? 0,
    milestones_total: milestonesTotal ?? 0,
  } as unknown as ProjectWithRelations;
}

export async function createProject(data: ProjectInsert): Promise<Project> {
  const profile = await requirePermission(Permission.PROJECTS_MANAGE);
  const supabase = await createClient();

  const { data: project, error } = await supabase
    .from("projects")
    .insert({ ...data, created_by: profile.id })
    .select()
    .single();

  if (error) throw error;

  if (data.project_manager_id) {
    await supabase.from("project_members").insert({
      project_id: project.id,
      user_id: data.project_manager_id,
      role: "Project Manager",
    });
  }

  await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    actor_email: profile.email,
    action: "project_created",
    target_id: project.id,
    target_email: null,
    metadata: {
      project_code: project.project_code,
      name: project.name,
      client_id: data.client_id,
      status: project.status,
    },
  });

  return project;
}

export async function updateProject(id: string, data: ProjectUpdate): Promise<Project> {
  const profile = await requirePermission(Permission.PROJECTS_MANAGE);
  const supabase = await createClient();

  const updateData: Record<string, unknown> = { ...data };
  if (data.status === "completed") {
    updateData.completed_at = new Date().toISOString();
    updateData.progress_percent = 100;
  }

  const { data: project, error } = await supabase
    .from("projects")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  const metadata: Record<string, unknown> = { changes: Object.keys(data) };
  if (data.status) metadata.new_status = data.status;

  await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    actor_email: profile.email,
    action: data.status ? "project_status_changed" : "project_updated",
    target_id: project.id,
    target_email: null,
    metadata,
  });

  // Send notification to project members
  await notifyProjectUpdated(profile.id, project.id, project.name).catch(() => {});

  return project;
}

// ──────────────────────────────────────────────
// PROJECT MEMBERS
// ──────────────────────────────────────────────

export async function getProjectMembers(projectId: string): Promise<ProjectMemberWithUser[]> {
  await requirePermission(Permission.PROJECTS_VIEW);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("project_members")
    .select(
      `*,
       user:profiles!project_members_user_id_fkey(id, full_name, email, role)`
    )
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []) as unknown as ProjectMemberWithUser[];
}

export async function addProjectMember(data: ProjectMemberInsert): Promise<ProjectMember> {
  const profile = await requirePermission(Permission.PROJECTS_MANAGE);
  const supabase = await createClient();

  const { data: member, error } = await supabase
    .from("project_members")
    .insert(data)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("This user is already a member of this project.");
    }
    throw error;
  }

  await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    actor_email: profile.email,
    action: "project_member_added",
    target_id: data.project_id,
    target_email: null,
    metadata: { user_id: data.user_id, role: data.role },
  });

  return member;
}

export async function removeProjectMember(projectId: string, userId: string): Promise<void> {
  const profile = await requirePermission(Permission.PROJECTS_MANAGE);
  const supabase = await createClient();

  const { error } = await supabase
    .from("project_members")
    .delete()
    .eq("project_id", projectId)
    .eq("user_id", userId);

  if (error) throw error;

  await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    actor_email: profile.email,
    action: "project_member_removed",
    target_id: projectId,
    target_email: null,
    metadata: { user_id: userId },
  });
}

// ──────────────────────────────────────────────
// PROJECT MILESTONES
// ──────────────────────────────────────────────

export async function getProjectMilestones(projectId: string): Promise<ProjectMilestoneWithStats[]> {
  await requirePermission(Permission.PROJECTS_VIEW);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("project_milestones")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true });

  if (error) throw error;

  return (data ?? []) as unknown as ProjectMilestoneWithStats[];
}

export async function createMilestone(data: ProjectMilestoneInsert): Promise<ProjectMilestone> {
  const profile = await requirePermission(Permission.PROJECTS_MANAGE);
  const supabase = await createClient();

  const { data: milestone, error } = await supabase
    .from("project_milestones")
    .insert(data)
    .select()
    .single();

  if (error) throw error;

  await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    actor_email: profile.email,
    action: "milestone_created",
    target_id: data.project_id,
    target_email: null,
    metadata: { milestone_id: milestone.id, name: milestone.name },
  });

  return milestone;
}

export async function updateMilestone(id: string, data: ProjectMilestoneUpdate): Promise<ProjectMilestone> {
  const profile = await requirePermission(Permission.PROJECTS_MANAGE);
  const supabase = await createClient();

  const updateData: Record<string, unknown> = { ...data };
  if (data.status === "completed") {
    updateData.completed_at = new Date().toISOString();
  }

  const { data: milestone, error } = await supabase
    .from("project_milestones")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    actor_email: profile.email,
    action: data.status === "completed" ? "milestone_completed" : "milestone_updated",
    target_id: milestone.project_id,
    target_email: null,
    metadata: { milestone_id: milestone.id, name: milestone.name, status: data.status },
  });

  // Send notification to project members
  const { data: project } = await supabase
    .from("projects")
    .select("name")
    .eq("id", milestone.project_id)
    .single();

  if (project) {
    await notifyMilestoneUpdated(
      profile.id,
      milestone.id,
      milestone.name,
      milestone.project_id,
      project.name
    ).catch(() => {});
  }

  return milestone;
}

export async function getTeamMembers(): Promise<Pick<Profile, "id" | "full_name" | "email" | "role">[]> {
  await requirePermission(Permission.PROJECTS_VIEW);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("is_active", true)
    .order("full_name");
  if (error) throw error;
  return data ?? [];
}
