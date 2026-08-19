import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ProjectStatus, ProjectPriority } from "@/types/clients";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, is_active")
    .eq("id", user.id)
    .single();

  if (!profile?.is_active)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sp = request.nextUrl.searchParams;
  const search = sp.get("search") ?? "";
  const client_id = sp.get("client_id") ?? undefined;
  const status = sp.get("status")?.split(",").filter(Boolean) as
    | ProjectStatus[]
    | undefined;
  const priority = sp.get("priority")?.split(",").filter(Boolean) as
    | ProjectPriority[]
    | undefined;
  const project_manager_id = sp.get("project_manager_id") ?? undefined;
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(sp.get("limit") ?? "20", 10))
  );
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
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

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

  return NextResponse.json({
    data: enriched ?? [],
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  });
}
