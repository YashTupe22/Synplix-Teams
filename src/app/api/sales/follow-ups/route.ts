import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { FollowUpStatus, FollowUpType } from "@/types/sales";

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
  const assigned_to = sp.get("assigned_to") ?? undefined;
  const status = sp.get("status")?.split(",").filter(Boolean) as
    | FollowUpStatus[]
    | undefined;
  const type = sp.get("type")?.split(",").filter(Boolean) as
    | FollowUpType[]
    | undefined;
  const date_from = sp.get("date_from") ?? undefined;
  const date_to = sp.get("date_to") ?? undefined;
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(sp.get("limit") ?? "20", 10))
  );
  const offset = (page - 1) * limit;

  let query = supabase
    .from("sales_follow_ups")
    .select(
      `*,
       lead:leads!sales_follow_ups_lead_id_fkey(id, title),
       assigned_user:profiles!sales_follow_ups_assigned_to_fkey(id, full_name, email),
       created_by_user:profiles!sales_follow_ups_created_by_fkey(id, full_name, email)`,
      { count: "exact" }
    );

  if (profile.role === "employee") {
    query = query.or(
      `assigned_to.eq.${profile.id},created_by.eq.${profile.id}`
    );
  }

  if (search) {
    query = query.or(
      `title.ilike.%${search}%,lead.title.ilike.%${search}%`
    );
  }
  if (assigned_to) {
    query = query.eq("assigned_to", assigned_to);
  }
  if (status && status.length > 0) {
    query = query.in("status", status);
  }
  if (type && type.length > 0) {
    query = query.in("type", type);
  }
  if (date_from) {
    query = query.gte("scheduled_at", date_from);
  }
  if (date_to) {
    query = query.lte("scheduled_at", date_to);
  }

  query = query.order("scheduled_at", { ascending: true });
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
