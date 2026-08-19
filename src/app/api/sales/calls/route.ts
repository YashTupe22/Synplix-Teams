import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
  const lead_id = sp.get("lead_id") ?? undefined;
  const user_id = sp.get("user_id") ?? undefined;
  const date_from = sp.get("date_from") ?? undefined;
  const date_to = sp.get("date_to") ?? undefined;
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(sp.get("limit") ?? "20", 10))
  );
  const offset = (page - 1) * limit;

  let query = supabase
    .from("sales_calls")
    .select(
      `*,
       lead:leads!sales_calls_lead_id_fkey(id, title),
       contact:contacts!sales_calls_contact_id_fkey(id, first_name, last_name),
       user:profiles!sales_calls_user_id_fkey(id, full_name, email)`,
      { count: "exact" }
    );

  if (profile.role === "employee") {
    query = query.eq("user_id", profile.id);
  }

  if (search) {
    query = query.or(
      `lead.title.ilike.%${search}%,notes.ilike.%${search}%`
    );
  }
  if (lead_id) {
    query = query.eq("lead_id", lead_id);
  }
  if (user_id) {
    query = query.eq("user_id", user_id);
  }
  if (date_from) {
    query = query.gte("started_at", date_from);
  }
  if (date_to) {
    query = query.lte("started_at", date_to);
  }

  query = query.order("started_at", { ascending: false });
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
