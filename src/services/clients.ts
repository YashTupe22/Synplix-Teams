import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { requirePermission, Permission } from "@/lib/authorization-server";
import type { Profile } from "@/types/database";
import type {
  Client,
  ClientInsert,
  ClientUpdate,
  ClientNote,
  ClientNoteInsert,
  ClientWithRelations,
  ClientNoteWithUser,
  ClientFilters,
  PaginatedResult,
} from "@/types/clients";

// ──────────────────────────────────────────────
// CLIENTS
// ──────────────────────────────────────────────

export async function getClients(
  filters: ClientFilters = {},
  profile: Profile
): Promise<PaginatedResult<ClientWithRelations>> {
  await requirePermission(Permission.CLIENTS_VIEW);
  const supabase = await createSupabaseClient();
  const {
    search,
    status,
    account_manager_id,
    page = 1,
    limit = 20,
  } = filters;
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
  if (error) throw error;

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

  return {
    data: enriched as unknown as ClientWithRelations[],
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}

export async function getClientById(id: string): Promise<ClientWithRelations | null> {
  await requirePermission(Permission.CLIENTS_VIEW);
  const supabase = await createSupabaseClient();

  const { data, error } = await supabase
    .from("clients")
    .select(
      `*,
       company:companies!clients_company_id_fkey(id, name, website, phone, email, city, country),
       primary_contact:contacts!clients_primary_contact_id_fkey(id, first_name, last_name, email, phone),
       account_manager:profiles!clients_account_manager_id_fkey(id, full_name, email),
       converted_by_user:profiles!clients_converted_by_fkey(id, full_name, email),
       lead:leads!clients_converted_from_lead_id_fkey(id, title),
       opportunity:sales_opportunities!clients_converted_from_opportunity_id_fkey(id, title, value)`
    )
    .eq("id", id)
    .single();

  if (error || !data) return null;

  const { count: activeCount } = await supabase
    .from("projects")
    .select("id", { count: "exact" })
    .eq("client_id", id)
    .in("status", ["planning", "active"]);

  const { count: totalCount } = await supabase
    .from("projects")
    .select("id", { count: "exact" })
    .eq("client_id", id);

  return {
    ...data,
    active_projects_count: activeCount ?? 0,
    total_projects_count: totalCount ?? 0,
  } as unknown as ClientWithRelations;
}

export async function createClient(data: ClientInsert): Promise<Client> {
  const profile = await requirePermission(Permission.CLIENTS_MANAGE);
  const supabase = await createSupabaseClient();

  const { data: existing } = await supabase
    .from("clients")
    .select("id, client_code")
    .eq("company_id", data.company_id)
    .in("status", ["active", "on_hold"])
    .maybeSingle();

  if (existing) {
    throw new Error(`This company is already a client (${existing.client_code}).`);
  }

  const { data: client, error } = await supabase
    .from("clients")
    .insert({ ...data, converted_by: profile.id })
    .select()
    .single();

  if (error) throw error;

  await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    actor_email: profile.email,
    action: "client_created",
    target_id: client.id,
    target_email: null,
    metadata: {
      client_code: client.client_code,
      company_id: data.company_id,
      converted_from_lead_id: data.converted_from_lead_id,
      converted_from_opportunity_id: data.converted_from_opportunity_id,
    },
  });

  return client;
}

export async function updateClient(id: string, data: ClientUpdate): Promise<Client> {
  const profile = await requirePermission(Permission.CLIENTS_MANAGE);
  const supabase = await createSupabaseClient();

  const { data: client, error } = await supabase
    .from("clients")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  const metadata: Record<string, unknown> = { changes: Object.keys(data) };
  if (data.status) metadata.new_status = data.status;
  if (data.account_manager_id) metadata.new_account_manager = data.account_manager_id;

  await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    actor_email: profile.email,
    action: "client_updated",
    target_id: client.id,
    target_email: null,
    metadata,
  });

  return client;
}

export async function convertOpportunityToClient(
  opportunityId: string,
  data: {
    primary_contact_id?: string;
    account_manager_id?: string;
    notes?: string;
  }
): Promise<Client> {
  const profile = await requirePermission(Permission.CLIENTS_MANAGE);
  const supabase = await createSupabaseClient();

  const { data: opp, error: oppError } = await supabase
    .from("sales_opportunities")
    .select("id, lead_id, stage, lead:leads!sales_opportunities_lead_id_fkey(id, title, company_id, contact_id)")
    .eq("id", opportunityId)
    .single();

  if (oppError || !opp) throw new Error("Opportunity not found.");
  if (opp.stage !== "closed_won") {
    throw new Error("Only WON opportunities can be converted to clients.");
  }

  const leadData = opp.lead as unknown as { id: string; company_id: string | null; contact_id: string | null } | null;
  if (!leadData?.company_id) {
    throw new Error("Opportunity lead must have an associated company.");
  }

  const { data: existing } = await supabase
    .from("clients")
    .select("id, client_code")
    .eq("company_id", leadData.company_id)
    .in("status", ["active", "on_hold"])
    .maybeSingle();

  if (existing) {
    throw new Error(`This company is already a client (${existing.client_code}).`);
  }

  const contactId = data.primary_contact_id || leadData.contact_id || null;

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .insert({
      company_id: leadData.company_id,
      primary_contact_id: contactId,
      account_manager_id: data.account_manager_id || null,
      notes: data.notes || null,
      converted_from_lead_id: opp.lead_id,
      converted_from_opportunity_id: opp.id,
      converted_by: profile.id,
    })
    .select()
    .single();

  if (clientError) throw clientError;

  await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    actor_email: profile.email,
    action: "client_converted",
    target_id: client.id,
    target_email: null,
    metadata: {
      client_code: client.client_code,
      opportunity_id: opp.id,
      lead_id: opp.lead_id,
      company_id: leadData.company_id,
    },
  });

  return client;
}

// ──────────────────────────────────────────────
// CLIENT NOTES
// ──────────────────────────────────────────────

export async function getClientNotes(
  clientId: string,
  page = 1,
  limit = 20
): Promise<PaginatedResult<ClientNoteWithUser>> {
  await requirePermission(Permission.CLIENTS_VIEW);
  const supabase = await createSupabaseClient();
  const offset = (page - 1) * limit;

  let query = supabase
    .from("client_notes")
    .select(
      `*,
       user:profiles!client_notes_user_id_fkey(id, full_name, email)`,
      { count: "exact" }
    )
    .eq("client_id", clientId);

  query = query.order("created_at", { ascending: false });
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    data: (data ?? []) as unknown as ClientNoteWithUser[],
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}

export async function createClientNote(data: ClientNoteInsert): Promise<ClientNote> {
  const profile = await requirePermission(Permission.CLIENTS_VIEW);
  const supabase = await createSupabaseClient();

  const { data: note, error } = await supabase
    .from("client_notes")
    .insert({ ...data, user_id: profile.id })
    .select()
    .single();

  if (error) throw error;

  await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    actor_email: profile.email,
    action: "client_note_added",
    target_id: data.client_id,
    target_email: null,
    metadata: { note_id: note.id },
  });

  return note;
}
