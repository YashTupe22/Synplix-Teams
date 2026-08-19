import { createClient } from "@/lib/supabase/server";
import { requirePermission, Permission } from "@/lib/authorization-server";
import type { Profile } from "@/types/database";
import type {
  SalesOpportunity,
  SalesOpportunityInsert,
  SalesOpportunityUpdate,
  SalesCall,
  SalesCallInsert,
  SalesFollowUp,
  SalesFollowUpInsert,
  SalesFollowUpUpdate,
  OpportunityWithRelations,
  CallWithRelations,
  FollowUpWithRelations,
  OpportunityFilters,
  FollowUpFilters,
  PaginatedResult,
  SalesMetrics,
  SalespersonPerformance,
} from "@/types/sales";

// ──────────────────────────────────────────────
// SALES OPPORTUNITIES
// ──────────────────────────────────────────────

export async function getOpportunities(
  filters: OpportunityFilters = {},
  profile: Profile
): Promise<PaginatedResult<OpportunityWithRelations>> {
  await requirePermission(Permission.SALES_VIEW);
  const supabase = await createClient();
  const {
    search,
    lead_id,
    stage,
    owner_id,
    min_value,
    max_value,
    expected_close_from,
    expected_close_to,
    page = 1,
    limit = 20,
  } = filters;
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
    query = query.or(`owner_id.eq.${profile.id},lead.assigned_to.eq.${profile.id}`);
  }

  if (lead_id) {
    query = query.eq("lead_id", lead_id);
  }
  if (search) {
    query = query.or(`title.ilike.%${search}%,lead.title.ilike.%${search}%`);
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
  if (expected_close_from) {
    query = query.gte("expected_close_date", expected_close_from);
  }
  if (expected_close_to) {
    query = query.lte("expected_close_date", expected_close_to);
  }

  query = query.order("created_at", { ascending: false });
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  const enriched = await Promise.all(
    (data ?? []).map(async (opp) => {
      let lead_company = null;
      let lead_contact = null;
      if (opp.lead?.company_id) {
        const { data: co } = await supabase.from("companies").select("id, name").eq("id", opp.lead.company_id).single();
        lead_company = co;
      }
      if (opp.lead?.contact_id) {
        const { data: ct } = await supabase.from("contacts").select("id, first_name, last_name, email, phone").eq("id", opp.lead.contact_id).single();
        lead_contact = ct;
      }
      return { ...opp, lead_company, lead_contact };
    })
  );

  return {
    data: enriched as unknown as OpportunityWithRelations[],
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}

export async function getOpportunityById(id: string): Promise<OpportunityWithRelations | null> {
  await requirePermission(Permission.SALES_VIEW);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sales_opportunities")
    .select(
      `*,
       lead:leads!sales_opportunities_lead_id_fkey(id, title, status, company_id, contact_id),
       owner:profiles!sales_opportunities_owner_id_fkey(id, full_name, email)`
    )
    .eq("id", id)
    .single();

  if (error || !data) return null;

  let lead_company = null;
  let lead_contact = null;
  if (data.lead?.company_id) {
    const { data: co } = await supabase.from("companies").select("id, name").eq("id", data.lead.company_id).single();
    lead_company = co;
  }
  if (data.lead?.contact_id) {
    const { data: ct } = await supabase.from("contacts").select("id, first_name, last_name, email, phone").eq("id", data.lead.contact_id).single();
    lead_contact = ct;
  }

  return { ...data, lead_company, lead_contact } as unknown as OpportunityWithRelations;
}

export async function createOpportunity(data: SalesOpportunityInsert): Promise<SalesOpportunity> {
  const profile = await requirePermission(Permission.SALES_MANAGE);
  const supabase = await createClient();

  const { data: opp, error } = await supabase
    .from("sales_opportunities")
    .insert({ ...data, owner_id: data.owner_id || profile.id, created_by: profile.id })
    .select()
    .single();

  if (error) throw error;

  await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    actor_email: profile.email,
    action: "opportunity_created",
    target_id: opp.id,
    target_email: null,
    metadata: { title: opp.title, stage: opp.stage, value: opp.value },
  });

  return opp;
}

export async function updateOpportunity(id: string, data: SalesOpportunityUpdate): Promise<SalesOpportunity> {
  const profile = await requirePermission(Permission.SALES_MANAGE);
  const supabase = await createClient();

  const updateData: Record<string, unknown> = { ...data };
  if (data.stage === "closed_won") {
    updateData.closed_at = new Date().toISOString();
  }

  const { data: opp, error } = await supabase
    .from("sales_opportunities")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  const metadata: Record<string, unknown> = { changes: Object.keys(data) };
  if (data.stage) {
    metadata.new_stage = data.stage;
  }

  await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    actor_email: profile.email,
    action: data.stage === "closed_won" ? "opportunity_won" : data.stage === "closed_lost" ? "opportunity_lost" : "opportunity_updated",
    target_id: opp.id,
    target_email: null,
    metadata,
  });

  return opp;
}

// ──────────────────────────────────────────────
// SALES CALLS
// ──────────────────────────────────────────────

export async function getCalls(
  filters: { lead_id?: string; user_id?: string; date_from?: string; date_to?: string; page?: number; limit?: number } = {},
  profile: Profile
): Promise<PaginatedResult<CallWithRelations>> {
  await requirePermission(Permission.SALES_VIEW);
  const supabase = await createClient();
  const { lead_id, user_id, date_from, date_to, page = 1, limit = 20 } = filters;
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
  if (error) throw error;

  return {
    data: (data ?? []) as unknown as CallWithRelations[],
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}

export async function createCall(data: SalesCallInsert): Promise<SalesCall> {
  const profile = await requirePermission(Permission.SALES_VIEW);
  const supabase = await createClient();

  const { data: call, error } = await supabase
    .from("sales_calls")
    .insert({ ...data, user_id: profile.id })
    .select()
    .single();

  if (error) throw error;

  // Update lead last_contacted_at
  await supabase
    .from("leads")
    .update({ last_contacted_at: new Date().toISOString() })
    .eq("id", data.lead_id);

  await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    actor_email: profile.email,
    action: "call_logged",
    target_id: call.id,
    target_email: null,
    metadata: { lead_id: data.lead_id, outcome: data.outcome },
  });

  return call;
}

// ──────────────────────────────────────────────
// SALES FOLLOW-UPS
// ──────────────────────────────────────────────

export async function getFollowUps(
  filters: FollowUpFilters = {},
  profile: Profile
): Promise<PaginatedResult<FollowUpWithRelations>> {
  await requirePermission(Permission.SALES_VIEW);
  const supabase = await createClient();
  const {
    search,
    lead_id,
    assigned_to,
    type,
    status,
    date_from,
    date_to,
    page = 1,
    limit = 20,
  } = filters;
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
    query = query.or(`assigned_to.eq.${profile.id},created_by.eq.${profile.id}`);
  }

  if (lead_id) {
    query = query.eq("lead_id", lead_id);
  }
  if (search) {
    query = query.or(`title.ilike.%${search}%,lead.title.ilike.%${search}%`);
  }
  if (assigned_to) {
    query = query.eq("assigned_to", assigned_to);
  }
  if (type && type.length > 0) {
    query = query.in("type", type);
  }
  if (status && status.length > 0) {
    query = query.in("status", status);
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
  if (error) throw error;

  const enriched = await Promise.all(
    (data ?? []).map(async (fu) => {
      let lead_company = null;
      let lead_contact = null;
      if (fu.lead?.id) {
        const { data: leadFull } = await supabase.from("leads").select("company_id, contact_id").eq("id", fu.lead.id).single();
        if (leadFull?.company_id) {
          const { data: co } = await supabase.from("companies").select("id, name").eq("id", leadFull.company_id).single();
          lead_company = co;
        }
        if (leadFull?.contact_id) {
          const { data: ct } = await supabase.from("contacts").select("id, first_name, last_name").eq("id", leadFull.contact_id).single();
          lead_contact = ct;
        }
      }
      return { ...fu, lead_company, lead_contact };
    })
  );

  return {
    data: enriched as unknown as FollowUpWithRelations[],
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}

export async function createFollowUp(data: SalesFollowUpInsert): Promise<SalesFollowUp> {
  const profile = await requirePermission(Permission.SALES_MANAGE);
  const supabase = await createClient();

  const { data: fu, error } = await supabase
    .from("sales_follow_ups")
    .insert({ ...data, created_by: profile.id })
    .select()
    .single();

  if (error) throw error;

  await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    actor_email: profile.email,
    action: "follow_up_created",
    target_id: fu.id,
    target_email: null,
    metadata: { lead_id: data.lead_id, type: data.type, title: data.title },
  });

  return fu;
}

export async function updateFollowUp(id: string, data: SalesFollowUpUpdate): Promise<SalesFollowUp> {
  const profile = await requirePermission(Permission.SALES_MANAGE);
  const supabase = await createClient();

  const updateData: Record<string, unknown> = { ...data };
  if (data.status === "completed") {
    updateData.completed_at = new Date().toISOString();
  }

  const { data: fu, error } = await supabase
    .from("sales_follow_ups")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  if (data.status) {
    await supabase.from("audit_logs").insert({
      actor_id: profile.id,
      actor_email: profile.email,
      action: `follow_up_${data.status}`,
      target_id: fu.id,
      target_email: null,
      metadata: { lead_id: fu.lead_id, type: fu.type },
    });
  }

  return fu;
}

// ──────────────────────────────────────────────
// METRICS
// ──────────────────────────────────────────────

export async function getSalesMetrics(profile: Profile): Promise<SalesMetrics> {
  await requirePermission(Permission.SALES_VIEW);
  const supabase = await createClient();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

  // Opportunities
  let oppQuery = supabase.from("sales_opportunities").select("stage, value, probability");
  if (profile.role === "employee") {
    oppQuery = oppQuery.or(`owner_id.eq.${profile.id},lead.assigned_to.eq.${profile.id}`);
  }
  const { data: opps } = await oppQuery;

  const openOpps = (opps ?? []).filter((o) => !["closed_won", "closed_lost"].includes(o.stage));

  const pipelineValue = openOpps.reduce((sum, o) => sum + (Number(o.value) || 0), 0);
  const weightedPipeline = openOpps.reduce((sum, o) => sum + ((Number(o.value) || 0) * (Number(o.probability) || 0) / 100), 0);

  // Won/Lost this month
  let wonMonthQuery = supabase.from("sales_opportunities").select("id, value").eq("stage", "closed_won").gte("closed_at", monthStart);
  let lostMonthQuery = supabase.from("sales_opportunities").select("id, value").eq("stage", "closed_lost").gte("closed_at", monthStart);
  if (profile.role === "employee") {
    wonMonthQuery = wonMonthQuery.eq("owner_id", profile.id);
    lostMonthQuery = lostMonthQuery.eq("owner_id", profile.id);
  }
  const [{ data: wonMonth }, { data: lostMonth }] = await Promise.all([wonMonthQuery, lostMonthQuery]);

  const wonValue = (wonMonth ?? []).reduce((sum, o) => sum + (Number(o.value) || 0), 0);
  const lostValue = (lostMonth ?? []).reduce((sum, o) => sum + (Number(o.value) || 0), 0);
  const wonCount = wonMonth?.length ?? 0;
  const lostCount = lostMonth?.length ?? 0;
  const totalClosed = wonCount + lostCount;
  const conversionRate = totalClosed > 0 ? Math.round((wonCount / totalClosed) * 100) : 0;

  // Calls today
  let callsQuery = supabase.from("sales_calls").select("id", { count: "exact" }).gte("started_at", todayStart).lt("started_at", tomorrowStart);
  if (profile.role === "employee") {
    callsQuery = callsQuery.eq("user_id", profile.id);
  }
  const { count: callsToday } = await callsQuery;

  // Follow-ups today
  let fuTodayQuery = supabase.from("sales_follow_ups").select("id", { count: "exact" }).gte("scheduled_at", todayStart).lt("scheduled_at", tomorrowStart).eq("status", "pending");
  if (profile.role === "employee") {
    fuTodayQuery = fuTodayQuery.eq("assigned_to", profile.id);
  }
  const { count: followUpsToday } = await fuTodayQuery;

  // Meetings today
  let meetingQuery = supabase.from("sales_follow_ups").select("id", { count: "exact" }).gte("scheduled_at", todayStart).lt("scheduled_at", tomorrowStart).eq("type", "meeting").eq("status", "pending");
  if (profile.role === "employee") {
    meetingQuery = meetingQuery.eq("assigned_to", profile.id);
  }
  const { count: meetingsToday } = await meetingQuery;

  // Overdue follow-ups
  let overdueQuery = supabase.from("sales_follow_ups").select("id", { count: "exact" }).lt("scheduled_at", now.toISOString()).eq("status", "pending");
  if (profile.role === "employee") {
    overdueQuery = overdueQuery.eq("assigned_to", profile.id);
  }
  const { count: overdueFollowUps } = await overdueQuery;

  return {
    totalOpen: openOpps.length,
    pipelineValue,
    weightedPipeline,
    wonThisMonth: wonCount,
    lostThisMonth: lostCount,
    wonValue,
    lostValue,
    conversionRate,
    callsToday: callsToday ?? 0,
    followUpsToday: followUpsToday ?? 0,
    meetingsToday: meetingsToday ?? 0,
    overdueFollowUps: overdueFollowUps ?? 0,
  };
}

export async function getSalespersonPerformance(profile: Profile): Promise<SalespersonPerformance[]> {
  await requirePermission(Permission.SALES_VIEW);
  const supabase = await createClient();

  let profilesQuery = supabase.from("profiles").select("id, full_name, email, role").eq("is_active", true).order("full_name");
  if (profile.role === "employee") {
    profilesQuery = profilesQuery.eq("id", profile.id);
  }
  const { data: teamMembers } = await profilesQuery;
  if (!teamMembers) return [];

  const results: SalespersonPerformance[] = [];

  for (const member of teamMembers) {
    const [callsRes, followUpsRes, oppsRes, wonOppsRes, lostOppsRes] = await Promise.all([
      supabase.from("sales_calls").select("id", { count: "exact" }).eq("user_id", member.id),
      supabase.from("sales_follow_ups").select("id", { count: "exact" }).eq("assigned_to", member.id),
      supabase.from("sales_opportunities").select("id, value, stage", { count: "exact" }).or(`owner_id.eq.${member.id}`),
      supabase.from("sales_opportunities").select("id, value").eq("owner_id", member.id).eq("stage", "closed_won"),
      supabase.from("sales_opportunities").select("id, value").eq("owner_id", member.id).eq("stage", "closed_lost"),
    ]);

    const allOpps = oppsRes.data ?? [];
    const openOpps = allOpps.filter((o) => !["closed_won", "closed_lost"].includes(o.stage));
    const won = wonOppsRes.data ?? [];
    const lost = lostOppsRes.data ?? [];
    const totalClosed = won.length + lost.length;

    // Count meetings from follow-ups assigned to this user
    const { count: meetingCount } = await supabase
      .from("sales_follow_ups")
      .select("id", { count: "exact" })
      .eq("assigned_to", member.id)
      .eq("type", "meeting");

    results.push({
      userId: member.id,
      fullName: member.full_name,
      email: member.email,
      calls: callsRes.count ?? 0,
      meetings: meetingCount ?? 0,
      followUps: followUpsRes.count ?? 0,
      openOpportunities: openOpps.length,
      wonDeals: won.length,
      wonValue: won.reduce((sum, o) => sum + (Number(o.value) || 0), 0),
      lostDeals: lost.length,
      conversionRate: totalClosed > 0 ? Math.round((won.length / totalClosed) * 100) : 0,
    });
  }

  return results;
}

export async function getTeamMembers(): Promise<Pick<Profile, "id" | "full_name" | "email">[]> {
  await requirePermission(Permission.SALES_VIEW);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("is_active", true)
    .order("full_name");
  if (error) throw error;
  return data ?? [];
}
