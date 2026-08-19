import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SalesStage } from "@/types/sales";

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
  const stage = sp.get("stage")?.split(",").filter(Boolean) as
    | SalesStage[]
    | undefined;
  const owner_id = sp.get("owner_id") ?? undefined;
  const min_value = sp.get("min_value")
    ? Number(sp.get("min_value"))
    : undefined;
  const max_value = sp.get("max_value")
    ? Number(sp.get("max_value"))
    : undefined;
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(sp.get("limit") ?? "20", 10))
  );
  const offset = (page - 1) * limit;

  let query = supabase
    .from("sales_opportunities")
    .select(
      `*,
       lead:leads!sales_opportunities_lead_id_fkey(id, title, status, company_id, contact_id),
       owner:profiles!sales_opportunities_owner_id_fkey(id, full_name, email)`,
      { count: "exact" }
    );

  if (profile.role === "employee") {
    query = query.or(
      `owner_id.eq.${profile.id},lead.assigned_to.eq.${profile.id}`
    );
  }

  if (search) {
    query = query.or(
      `title.ilike.%${search}%,lead.title.ilike.%${search}%`
    );
  }
  if (stage && stage.length > 0) {
    query = query.in("stage", stage);
  }
  if (owner_id) {
    query = query.eq("owner_id", owner_id);
  }
  if (min_value !== undefined) {
    query = query.gte("value", min_value);
  }
  if (max_value !== undefined) {
    query = query.lte("value", max_value);
  }

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
