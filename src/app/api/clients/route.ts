import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ClientStatus } from "@/types/clients";

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
  const status = sp.get("status")?.split(",").filter(Boolean) as
    | ClientStatus[]
    | undefined;
  const account_manager_id = sp.get("account_manager_id") ?? undefined;
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(sp.get("limit") ?? "20", 10))
  );
  const offset = (page - 1) * limit;

  let query = supabase
    .from("clients")
    .select(
      `*,
       company:companies!clients_company_id_fkey(id, name, website, phone, email, city, country),
       primary_contact:contacts!clients_primary_contact_id_fkey(id, first_name, last_name, email, phone),
       account_manager:profiles!clients_account_manager_id_fkey(id, full_name, email),
       converted_by_user:profiles!clients_converted_by_fkey(id, full_name, email),
       lead:leads!clients_converted_from_lead_id_fkey(id, title),
       opportunity:sales_opportunities!clients_converted_from_opportunity_id_fkey(id, title, value)`,
      { count: "exact" }
    );

  if (profile.role === "employee") {
    query = query.or(`
      account_manager_id.eq.${profile.id},
      EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.client_id = clients.id
          AND (
            p.project_manager_id = ${profile.id}
            OR EXISTS (
              SELECT 1 FROM public.project_members pm
              WHERE pm.project_id = p.id AND pm.user_id = ${profile.id}
            )
          )
      )
    `);
  }

  if (search) {
    query = query.or(`
      client_code.ilike.%${search}%,
      company.name.ilike.%${search}%,
      primary_contact.first_name.ilike.%${search}%,
      primary_contact.last_name.ilike.%${search}%,
      account_manager.full_name.ilike.%${search}%
    `);
  }
  if (status && status.length > 0) {
    query = query.in("status", status);
  }
  if (account_manager_id) {
    query = query.eq("account_manager_id", account_manager_id);
  }

  query = query.order("created_at", { ascending: false });
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const enriched = await Promise.all(
    (data ?? []).map(async (client) => {
      const { count: activeCount } = await supabase
        .from("projects")
        .select("id", { count: "exact" })
        .eq("client_id", client.id)
        .in("status", ["planning", "active"]);

      const { count: totalCount } = await supabase
        .from("projects")
        .select("id", { count: "exact" })
        .eq("client_id", client.id);

      return {
        ...client,
        active_projects_count: activeCount ?? 0,
        total_projects_count: totalCount ?? 0,
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
