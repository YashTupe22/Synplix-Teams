import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { LeadStatus, LeadPriority } from "@/types/crm";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, is_active")
    .eq("id", user.id)
    .single();

  if (!profile?.is_active) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sp = request.nextUrl.searchParams;
  const search = sp.get("search") ?? "";
  const status = sp.get("status")?.split(",").filter(Boolean) as LeadStatus[] | undefined;
  const priority = sp.get("priority")?.split(",").filter(Boolean) as LeadPriority[] | undefined;
  const assigned_to = sp.get("assigned_to") ?? undefined;
  const source_id = sp.get("source_id") ?? undefined;
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(sp.get("limit") ?? "20", 10)));
  const offset = (page - 1) * limit;

  let query = supabase
    .from("leads")
    .select(
      `*,
       company:companies(id, name),
       contact:contacts(id, first_name, last_name, email, phone),
       assigned_user:profiles!leads_assigned_to_fkey(id, full_name, email),
       source:lead_sources(id, name)`,
      { count: "exact" }
    )
    .is("archived_at", null);

  if (profile.role === "employee") {
    query = query.eq("assigned_to", user.id);
  }

  if (search) {
    query = query.or(
      `title.ilike.%${search}%,description.ilike.%${search}%,company.name.ilike.%${search}%,contact.first_name.ilike.%${search}%,contact.last_name.ilike.%${search}%`
    );
  }
  if (status && status.length > 0) query = query.in("status", status);
  if (priority && priority.length > 0) query = query.in("priority", priority);
  if (assigned_to) query = query.eq("assigned_to", assigned_to);
  if (source_id) query = query.eq("source_id", source_id);

  query = query.order("created_at", { ascending: false });
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    data: data ?? [],
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  });
}
