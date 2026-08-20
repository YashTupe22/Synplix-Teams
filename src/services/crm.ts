import { createClient } from "@/lib/supabase/server";
import { requirePermission, Permission } from "@/lib/authorization-server";
import type { Profile } from "@/types/database";
import { notifyLeadAssigned } from "@/services/notification-integrations";
import type {
  Company,
  CompanyInsert,
  CompanyUpdate,
  Contact,
  ContactInsert,
  ContactUpdate,
  Lead,
  LeadInsert,
  LeadUpdate,
  LeadSource,
  LeadActivity,
  LeadActivityInsert,
  LeadNote,
  LeadNoteInsert,
  LeadWithRelations,
  LeadFilters,
  PaginatedResult,
} from "@/types/crm";

// ──────────────────────────────────────────────
// COMPANIES
// ──────────────────────────────────────────────

export async function getCompanies(
  filters: { search?: string; page?: number; limit?: number } = {}
): Promise<PaginatedResult<Company>> {
  await requirePermission(Permission.CRM_VIEW);
  const supabase = await createClient();
  const { search, page = 1, limit = 20 } = filters;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("companies")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(`name.ilike.%${search}%,industry.ilike.%${search}%,city.ilike.%${search}%`);
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    data: data ?? [],
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}

export async function getCompanyById(id: string): Promise<Company | null> {
  await requirePermission(Permission.CRM_VIEW);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data;
}

export async function getCompanyWithRelations(id: string) {
  await requirePermission(Permission.CRM_VIEW);
  const supabase = await createClient();

  const { data: company, error } = await supabase
    .from("companies")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !company) return null;

  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, first_name, last_name, email, phone, job_title")
    .eq("company_id", id)
    .order("created_at", { ascending: false });

  const { data: leads } = await supabase
    .from("leads")
    .select("id, title, status, priority, estimated_value, created_at")
    .eq("company_id", id)
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  return { company, contacts: contacts ?? [], leads: leads ?? [] };
}

export async function createCompany(data: CompanyInsert): Promise<Company> {
  const profile = await requirePermission(Permission.CRM_MANAGE);
  const supabase = await createClient();

  const { data: company, error } = await supabase
    .from("companies")
    .insert({ ...data, created_by: profile.id })
    .select()
    .single();

  if (error) throw error;

  await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    actor_email: profile.email,
    action: "company_created",
    target_id: company.id,
    target_email: null,
    metadata: { name: company.name },
  });

  return company;
}

export async function updateCompany(id: string, data: CompanyUpdate): Promise<Company> {
  const profile = await requirePermission(Permission.CRM_MANAGE);
  const supabase = await createClient();

  const { data: company, error } = await supabase
    .from("companies")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    actor_email: profile.email,
    action: "company_updated",
    target_id: company.id,
    target_email: null,
    metadata: { name: company.name, changes: Object.keys(data) },
  });

  return company;
}

// ──────────────────────────────────────────────
// CONTACTS
// ──────────────────────────────────────────────

export async function getContacts(
  filters: { search?: string; company_id?: string; page?: number; limit?: number } = {}
): Promise<PaginatedResult<Contact & { company: Pick<Company, "id" | "name"> | null }>> {
  await requirePermission(Permission.CRM_VIEW);
  const supabase = await createClient();
  const { search, company_id, page = 1, limit = 20 } = filters;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("contacts")
    .select("*, company:companies(id, name)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
  }
  if (company_id) {
    query = query.eq("company_id", company_id);
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    data: (data ?? []) as (Contact & { company: Pick<Company, "id" | "name"> | null })[],
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}

export async function getContactById(id: string) {
  await requirePermission(Permission.CRM_VIEW);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contacts")
    .select("*, company:companies(id, name)")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as Contact & { company: Pick<Company, "id" | "name"> | null };
}

export async function createContact(data: ContactInsert): Promise<Contact> {
  const profile = await requirePermission(Permission.CRM_MANAGE);
  const supabase = await createClient();

  const { data: contact, error } = await supabase
    .from("contacts")
    .insert({ ...data, created_by: profile.id })
    .select()
    .single();

  if (error) throw error;

  await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    actor_email: profile.email,
    action: "contact_created",
    target_id: contact.id,
    target_email: null,
    metadata: { name: `${contact.first_name} ${contact.last_name ?? ""}`.trim() },
  });

  return contact;
}

export async function updateContact(id: string, data: ContactUpdate): Promise<Contact> {
  const profile = await requirePermission(Permission.CRM_MANAGE);
  const supabase = await createClient();

  const { data: contact, error } = await supabase
    .from("contacts")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    actor_email: profile.email,
    action: "contact_updated",
    target_id: contact.id,
    target_email: null,
    metadata: { changes: Object.keys(data) },
  });

  return contact;
}

// ──────────────────────────────────────────────
// LEADS
// ──────────────────────────────────────────────

export async function getLeads(
  filters: LeadFilters = {},
  profile: Profile
): Promise<PaginatedResult<LeadWithRelations>> {
  await requirePermission(Permission.CRM_VIEW);
  const supabase = await createClient();
  const {
    search,
    status,
    priority,
    assigned_to,
    source_id,
    archived = false,
    page = 1,
    limit = 20,
    sort = "created_at",
    order = "desc",
  } = filters;
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
    );

  // Role-based filtering
  if (profile.role === "employee") {
    query = query.eq("assigned_to", profile.id);
  }

  // Archival filter
  if (archived) {
    query = query.not("archived_at", "is", null);
  } else {
    query = query.is("archived_at", null);
  }

  // Search
  if (search) {
    query = query.or(
      `title.ilike.%${search}%,description.ilike.%${search}%,company.name.ilike.%${search}%,contact.first_name.ilike.%${search}%,contact.last_name.ilike.%${search}%`
    );
  }

  // Filters
  if (status && status.length > 0) {
    query = query.in("status", status);
  }
  if (priority && priority.length > 0) {
    query = query.in("priority", priority);
  }
  if (assigned_to) {
    query = query.eq("assigned_to", assigned_to);
  }
  if (source_id) {
    query = query.eq("source_id", source_id);
  }

  // Sorting
  query = query.order(sort, { ascending: order === "asc" });

  // Pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    data: (data ?? []) as unknown as LeadWithRelations[],
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}

export async function getLeadById(id: string): Promise<LeadWithRelations | null> {
  await requirePermission(Permission.CRM_VIEW);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leads")
    .select(
      `*,
       company:companies(id, name, website, phone, email, city, country),
       contact:contacts(id, first_name, last_name, email, phone, job_title, linkedin_url),
       assigned_user:profiles!leads_assigned_to_fkey(id, full_name, email),
       source:lead_sources(id, name)`
    )
    .eq("id", id)
    .single();

  if (error) return null;
  return data as unknown as LeadWithRelations;
}

export async function createLead(data: LeadInsert): Promise<Lead> {
  const profile = await requirePermission(Permission.CRM_MANAGE);
  const supabase = await createClient();

  const { data: lead, error } = await supabase
    .from("leads")
    .insert({ ...data, created_by: profile.id })
    .select()
    .single();

  if (error) throw error;

  await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    actor_email: profile.email,
    action: "lead_created",
    target_id: lead.id,
    target_email: null,
    metadata: { title: lead.title, status: lead.status },
  });

  return lead;
}

export async function updateLead(id: string, data: LeadUpdate): Promise<Lead> {
  const profile = await requirePermission(Permission.CRM_MANAGE);
  const supabase = await createClient();

  const { data: lead, error } = await supabase
    .from("leads")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  const metadata: Record<string, unknown> = { changes: Object.keys(data) };
  if (data.status) metadata.new_status = data.status;
  if (data.assigned_to) metadata.assigned_to = data.assigned_to;

  await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    actor_email: profile.email,
    action: data.status ? "lead_status_changed" : "lead_updated",
    target_id: lead.id,
    target_email: null,
    metadata,
  });

  // Send notification if lead is assigned
  if (data.assigned_to && data.assigned_to !== lead.assigned_to) {
    await notifyLeadAssigned(profile.id, lead.id, lead.title, data.assigned_to).catch(() => {});
  }

  return lead;
}

export async function archiveLead(id: string): Promise<void> {
  const profile = await requirePermission(Permission.CRM_MANAGE);
  const supabase = await createClient();

  const { error } = await supabase
    .from("leads")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;

  await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    actor_email: profile.email,
    action: "lead_archived",
    target_id: id,
    target_email: null,
    metadata: {},
  });
}

// ──────────────────────────────────────────────
// LEAD SOURCES
// ──────────────────────────────────────────────

export async function getLeadSources(): Promise<LeadSource[]> {
  await requirePermission(Permission.CRM_VIEW);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lead_sources")
    .select("*")
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

// ──────────────────────────────────────────────
// LEAD ACTIVITIES
// ──────────────────────────────────────────────

export async function getLeadActivities(leadId: string): Promise<(LeadActivity & { user: Pick<Profile, "id" | "full_name" | "email"> | null })[]> {
  await requirePermission(Permission.CRM_VIEW);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("lead_activities")
    .select("*, user:profiles!lead_activities_user_id_fkey(id, full_name, email)")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as (LeadActivity & { user: Pick<Profile, "id" | "full_name" | "email"> | null })[];
}

export async function createLeadActivity(data: LeadActivityInsert): Promise<LeadActivity> {
  const profile = await requirePermission(Permission.CRM_MANAGE);
  const supabase = await createClient();

  const { data: activity, error } = await supabase
    .from("lead_activities")
    .insert({ ...data, user_id: profile.id })
    .select()
    .single();

  if (error) throw error;
  return activity;
}

// ──────────────────────────────────────────────
// LEAD NOTES
// ──────────────────────────────────────────────

export async function getLeadNotes(leadId: string): Promise<(LeadNote & { user: Pick<Profile, "id" | "full_name" | "email"> | null })[]> {
  await requirePermission(Permission.CRM_VIEW);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("lead_notes")
    .select("*, user:profiles!lead_notes_user_id_fkey(id, full_name, email)")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as (LeadNote & { user: Pick<Profile, "id" | "full_name" | "email"> | null })[];
}

export async function createLeadNote(data: LeadNoteInsert): Promise<LeadNote> {
  const profile = await requirePermission(Permission.CRM_MANAGE);
  const supabase = await createClient();

  const { data: note, error } = await supabase
    .from("lead_notes")
    .insert({ ...data, user_id: profile.id })
    .select()
    .single();

  if (error) throw error;
  return note;
}

// ──────────────────────────────────────────────
// TEAM MEMBERS (for assignment dropdown)
// ──────────────────────────────────────────────

export async function getTeamMembersForAssignment(): Promise<Pick<Profile, "id" | "full_name" | "email" | "role">[]> {
  await requirePermission(Permission.CRM_VIEW);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("is_active", true)
    .order("full_name");

  if (error) throw error;
  return data ?? [];
}

// ──────────────────────────────────────────────
// PIPELINE STATS
// ──────────────────────────────────────────────

export async function getPipelineStats(profile: Profile) {
  await requirePermission(Permission.CRM_VIEW);
  const supabase = await createClient();

  let query = supabase
    .from("leads")
    .select("status", { count: "exact" })
    .is("archived_at", null);

  if (profile.role === "employee") {
    query = query.eq("assigned_to", profile.id);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  const statuses = (data ?? []).map((r) => r.status);
  const statusCounts: Record<string, number> = {};
  for (const s of statuses) {
    statusCounts[s] = (statusCounts[s] ?? 0) + 1;
  }

  return {
    total: count ?? 0,
    byStatus: statusCounts,
  };
}

// ──────────────────────────────────────────────
// SEARCH (for global search)
// ──────────────────────────────────────────────

export async function searchLeads(search: string, profile: Profile): Promise<LeadWithRelations[]> {
  const supabase = await createClient();

  let query = supabase
    .from("leads")
    .select(
      `*,
       company:companies(id, name),
       contact:contacts(id, first_name, last_name),
       assigned_user:profiles!leads_assigned_to_fkey(id, full_name, email),
       source:lead_sources(id, name)`
    )
    .is("archived_at", null)
    .or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    .limit(10);

  if (profile.role === "employee") {
    query = query.eq("assigned_to", profile.id);
  }

  const { data, error } = await query;
  if (error) return [];
  return (data ?? []) as unknown as LeadWithRelations[];
}
