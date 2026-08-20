import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/authorization-server";
import { Permission } from "@/lib/authorization";
import type { UserRole } from "@/types/database";
import type {
  DateRange,
  DateRangePreset,
  AnalyticsQuery,
  AnalyticsSummary,
  SalesAnalytics,
  SalesTeamAnalytics,
  SalesTeamMember,
  ClientAnalytics,
  TopClient,
  ProjectAnalytics,
  TeamAnalytics,
  TeamMember,
  FinanceAnalytics,
  PeriodValue,
  ClientOutstanding,
  ClientRevenue,
  PeriodTrend,
  TimeSeriesData,
  FunnelStage,
  SalesFunnel,
  TopSalesperson,
} from "@/types/analytics";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

// ============================================================
// Date Range Helpers
// ============================================================

function computeDateRange(preset: DateRangePreset, customFrom?: string, customTo?: string): DateRange {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let from: Date | null = null;
  let to: Date | null = null;

  switch (preset) {
    case "today":
      from = today;
      to = new Date(today.getTime() + 86400000);
      break;
    case "7d":
      from = new Date(today.getTime() - 7 * 86400000);
      to = new Date(today.getTime() + 86400000);
      break;
    case "30d":
      from = new Date(today.getTime() - 30 * 86400000);
      to = new Date(today.getTime() + 86400000);
      break;
    case "90d":
      from = new Date(today.getTime() - 90 * 86400000);
      to = new Date(today.getTime() + 86400000);
      break;
    case "month":
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      to = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      break;
    case "year":
      from = new Date(now.getFullYear(), 0, 1);
      to = new Date(now.getFullYear() + 1, 0, 1);
      break;
    case "custom":
      from = customFrom ? new Date(customFrom) : null;
      to = customTo ? new Date(new Date(customTo).getTime() + 86400000) : null;
      break;
  }

  return {
    preset,
    from: from ? from.toISOString() : null,
    to: to ? to.toISOString() : null,
  };
}

function formatDateLocal(d: Date): string {
  return d.toISOString().split("T")[0];
}

function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function generateMonthPeriods(from: string, to: string): string[] {
  const periods: string[] = [];
  const start = new Date(from);
  const end = new Date(to);
  const current = new Date(start.getFullYear(), start.getMonth(), 1);

  while (current <= end) {
    periods.push(`${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`);
    current.setMonth(current.getMonth() + 1);
  }

  return periods;
}

function sumArray(arr: number[]): number {
  return arr.reduce((sum, v) => sum + (v || 0), 0);
}

function safeRate(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 100) / 100;
}

// ============================================================
// Role Helpers
// ============================================================

function isAdminOrManager(role: UserRole): boolean {
  return role === "admin" || role === "manager";
}

// ============================================================
// Finance Analytics
// ============================================================

async function getFinanceMetrics(
  supabase: SupabaseClient,
  dateRange: DateRange,
  role: UserRole,
  userId: string
): Promise<{
  revenue: number;
  paymentsReceived: number;
  invoicedValue: number;
  outstanding: number;
  overdue: number;
  expenses: number;
  netCashMovement: number;
}> {
  const today = formatDateLocal(new Date());
  const fromFilter = dateRange.from ? formatDateLocal(new Date(dateRange.from)) : null;
  const toFilter = dateRange.to ? formatDateLocal(new Date(new Date(dateRange.to).getTime() - 86400000)) : null;

  // Revenue: SUM(payments.amount) for non-cancelled invoices in date range
  let paymentsQuery = supabase
    .from("payments")
    .select("amount, payment_date, invoices!inner(status)")
    .neq("invoices.status", "cancelled");

  if (fromFilter) paymentsQuery = paymentsQuery.gte("payment_date", fromFilter);
  if (toFilter) paymentsQuery = paymentsQuery.lte("payment_date", toFilter);

  // Invoiced Value: SUM(invoices.total_amount) for non-cancelled in date range
  let invoicesQuery = supabase
    .from("invoices")
    .select("total_amount, balance_due, due_date, status, invoice_date")
    .neq("status", "cancelled");

  if (fromFilter) invoicesQuery = invoicesQuery.gte("invoice_date", fromFilter);
  if (toFilter) invoicesQuery = invoicesQuery.lte("invoice_date", toFilter);

  // Outstanding & Overdue: all non-cancelled invoices (not date-filtered for outstanding)
  const { data: allInvoices } = await supabase
    .from("invoices")
    .select("total_amount, balance_due, due_date, status")
    .neq("status", "cancelled");

  // Expenses: SUM(expenses.amount) for non-cancelled in date range
  let expensesQuery = supabase
    .from("expenses")
    .select("amount, expense_date, status")
    .eq("status", "recorded");

  if (fromFilter) expensesQuery = expensesQuery.gte("expense_date", fromFilter);
  if (toFilter) expensesQuery = expensesQuery.lte("expense_date", toFilter);

  const [paymentsRes, invoicesRes, expensesRes] = await Promise.all([
    paymentsQuery,
    invoicesQuery,
    expensesQuery,
  ]);

  const payments = paymentsRes.data ?? [];
  const invoices = invoicesRes.data ?? [];
  const expenses = expensesRes.data ?? [];
  const invoicesAll = allInvoices ?? [];

  const revenue = sumArray(payments.map((p) => Number(p.amount) || 0));
  const invoicedValue = sumArray(invoices.map((i) => Number(i.total_amount) || 0));
  const outstanding = sumArray(
    invoicesAll
      .filter((i) => i.status !== "paid" && i.status !== "cancelled" && Number(i.balance_due) > 0)
      .map((i) => Number(i.balance_due) || 0)
  );
  const overdue = sumArray(
    invoicesAll
      .filter(
        (i) =>
          i.status !== "paid" &&
          i.status !== "cancelled" &&
          i.due_date &&
          i.due_date < today &&
          Number(i.balance_due) > 0
      )
      .map((i) => Number(i.balance_due) || 0)
  );
  const totalExpenses = sumArray(expenses.map((e) => Number(e.amount) || 0));
  const netCashMovement = revenue - totalExpenses;

  return {
    revenue,
    paymentsReceived: revenue,
    invoicedValue,
    outstanding,
    overdue,
    expenses: totalExpenses,
    netCashMovement,
  };
}

async function getFinanceTimeSeries(
  supabase: SupabaseClient,
  dateRange: DateRange
): Promise<{
  revenueByMonth: PeriodValue[];
  paymentsByMonth: PeriodValue[];
  expensesByMonth: PeriodValue[];
  outstandingByClient: ClientOutstanding[];
  revenueByClient: ClientRevenue[];
}> {
  const fromFilter = dateRange.from ? formatDateLocal(new Date(dateRange.from)) : null;
  const toFilter = dateRange.to ? formatDateLocal(new Date(new Date(dateRange.to).getTime() - 86400000)) : null;
  const periods = dateRange.from && dateRange.to
    ? generateMonthPeriods(
        formatDateLocal(new Date(dateRange.from)),
        formatDateLocal(new Date(new Date(dateRange.to).getTime() - 86400000))
      )
    : [];

  // Payments with invoice client info for revenue by client
  let paymentsQuery = supabase
    .from("payments")
    .select("amount, payment_date, invoices!inner(status, client_id, clients!inner(id, client_code, companies!inner(name)))")
    .neq("invoices.status", "cancelled");

  if (fromFilter) paymentsQuery = paymentsQuery.gte("payment_date", fromFilter);
  if (toFilter) paymentsQuery = paymentsQuery.lte("payment_date", toFilter);

  // Expenses by month
  let expensesQuery = supabase
    .from("expenses")
    .select("amount, expense_date, status")
    .eq("status", "recorded");

  if (fromFilter) expensesQuery = expensesQuery.gte("expense_date", fromFilter);
  if (toFilter) expensesQuery = expensesQuery.lte("expense_date", toFilter);

  // Outstanding by client
  const { data: outstandingInvoices } = await supabase
    .from("invoices")
    .select("client_id, balance_due, status, clients!inner(id, client_code, companies!inner(name))")
    .neq("status", "cancelled")
    .gt("balance_due", 0);

  const [paymentsRes, expensesRes] = await Promise.all([paymentsQuery, expensesQuery]);

  const paymentsData = paymentsRes.data ?? [];
  const expensesData = expensesRes.data ?? [];

  // Revenue by month
  const revenueByMonthMap: Record<string, number> = {};
  for (const p of paymentsData) {
    const key = getMonthKey(p.payment_date);
    revenueByMonthMap[key] = (revenueByMonthMap[key] || 0) + (Number(p.amount) || 0);
  }
  const revenueByMonth: PeriodValue[] = periods.map((p) => ({
    period: p,
    value: revenueByMonthMap[p] || 0,
  }));

  // Payments by month (same as revenue but from payments table)
  const paymentsByMonth = [...revenueByMonth];

  // Expenses by month
  const expensesByMonthMap: Record<string, number> = {};
  for (const e of expensesData) {
    const key = getMonthKey(e.expense_date);
    expensesByMonthMap[key] = (expensesByMonthMap[key] || 0) + (Number(e.amount) || 0);
  }
  const expensesByMonth: PeriodValue[] = periods.map((p) => ({
    period: p,
    value: expensesByMonthMap[p] || 0,
  }));

  // Outstanding by client
  const outstandingMap: Record<string, { clientCode: string; companyName: string | null; outstanding: number }> = {};
  for (const inv of outstandingInvoices ?? []) {
    const clientId = inv.client_id;
    if (!outstandingMap[clientId]) {
      const clientArr = (inv as Record<string, unknown>).clients as { id: string; client_code: string; companies: { name: string }[] }[] | undefined;
      const clientData = clientArr?.[0];
      outstandingMap[clientId] = {
        clientCode: clientData?.client_code || "",
        companyName: clientData?.companies?.[0]?.name || null,
        outstanding: 0,
      };
    }
    outstandingMap[clientId].outstanding += Number(inv.balance_due) || 0;
  }
  const outstandingByClient: ClientOutstanding[] = Object.entries(outstandingMap)
    .map(([clientId, data]) => ({ clientId, ...data }))
    .sort((a, b) => b.outstanding - a.outstanding)
    .slice(0, 10);

  // Revenue by client
  const revenueClientMap: Record<string, { clientCode: string; companyName: string | null; revenue: number }> = {};
  for (const p of paymentsData) {
    const invoiceData = (p as Record<string, unknown>).invoices as { client_id: string; clients: { client_code: string; companies: { name: string }[] }[] } | undefined;
    if (!invoiceData) continue;
    const clientData = invoiceData.clients?.[0];
    const clientId = invoiceData.client_id;
    if (!revenueClientMap[clientId]) {
      revenueClientMap[clientId] = {
        clientCode: clientData?.client_code || "",
        companyName: clientData?.companies?.[0]?.name || null,
        revenue: 0,
      };
    }
    revenueClientMap[clientId].revenue += Number(p.amount) || 0;
  }
  const revenueByClient: ClientRevenue[] = Object.entries(revenueClientMap)
    .map(([clientId, data]) => ({ clientId, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  return { revenueByMonth, paymentsByMonth, expensesByMonth, outstandingByClient, revenueByClient };
}

// ============================================================
// Sales Analytics
// ============================================================

async function getSalesMetrics(
  supabase: SupabaseClient,
  dateRange: DateRange,
  role: UserRole,
  userId: string
): Promise<SalesAnalytics> {
  const fromFilter = dateRange.from ? formatDateLocal(new Date(dateRange.from)) : null;
  const toFilter = dateRange.to ? formatDateLocal(new Date(new Date(dateRange.to).getTime() - 86400000)) : null;

  // Leads
  let leadsQuery = supabase.from("leads").select("id, status, created_at").is("archived_at", null);
  if (fromFilter) leadsQuery = leadsQuery.gte("created_at", fromFilter);
  if (toFilter) leadsQuery = leadsQuery.lte("created_at", toFilter);

  // Opportunities
  let oppsQuery = supabase.from("sales_opportunities").select("id, stage, value, created_at");
  if (fromFilter) oppsQuery = oppsQuery.gte("created_at", fromFilter);
  if (toFilter) oppsQuery = oppsQuery.lte("created_at", toFilter);

  const [leadsRes, oppsRes] = await Promise.all([leadsQuery, oppsQuery]);

  const leads = leadsRes.data ?? [];
  const opps = oppsRes.data ?? [];

  const totalLeads = leads.length;
  const newLeads = leads.filter((l) => l.status === "new").length;
  const qualifiedLeads = leads.filter((l) =>
    ["interested", "meeting", "proposal", "negotiation", "won"].includes(l.status)
  ).length;
  const convertedLeads = leads.filter((l) => l.status === "won").length;

  const openOpps = opps.filter((o) => !["closed_won", "closed_lost"].includes(o.stage));
  const wonOpps = opps.filter((o) => o.stage === "closed_won");
  const lostOpps = opps.filter((o) => o.stage === "closed_lost");
  const closedOpps = [...wonOpps, ...lostOpps];

  const pipelineValue = sumArray(openOpps.map((o) => Number(o.value) || 0));
  const wonRevenue = sumArray(wonOpps.map((o) => Number(o.value) || 0));
  const conversionRate = safeRate(convertedLeads, totalLeads);
  const winRate = safeRate(wonOpps.length, closedOpps.length);

  // Trends
  const periods = fromFilter && toFilter
    ? generateMonthPeriods(formatDateLocal(new Date(dateRange.from!)), formatDateLocal(new Date(new Date(dateRange.to!).getTime() - 86400000)))
    : [];
  const leadsByMonth: Record<string, number> = {};
  for (const l of leads) {
    const key = getMonthKey(l.created_at);
    leadsByMonth[key] = (leadsByMonth[key] || 0) + 1;
  }
  const trends: PeriodTrend[] = periods.map((p) => ({
    period: p,
    value: leadsByMonth[p] || 0,
  }));

  return {
    totalLeads,
    newLeads,
    qualifiedLeads,
    convertedLeads,
    openOpportunities: openOpps.length,
    wonOpportunities: wonOpps.length,
    lostOpportunities: lostOpps.length,
    pipelineValue,
    wonRevenue,
    conversionRate,
    winRate,
    trends,
  };
}

async function getSalesTeamMetrics(
  supabase: SupabaseClient,
  dateRange: DateRange
): Promise<SalesTeamAnalytics> {
  const fromFilter = dateRange.from ? formatDateLocal(new Date(dateRange.from)) : null;
  const toFilter = dateRange.to ? formatDateLocal(new Date(new Date(dateRange.to).getTime() - 86400000)) : null;

  // Get all profiles
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("is_active", true);

  const members: SalesTeamMember[] = [];

  for (const profile of profiles ?? []) {
    // Leads assigned
    let leadsQ = supabase.from("leads").select("id", { count: "exact" }).eq("assigned_to", profile.id).is("archived_at", null);
    if (fromFilter) leadsQ = leadsQ.gte("created_at", fromFilter);
    if (toFilter) leadsQ = leadsQ.lte("created_at", toFilter);

    // Opportunities owned
    let oppsQ = supabase.from("sales_opportunities").select("id, stage, value").eq("owner_id", profile.id);
    if (fromFilter) oppsQ = oppsQ.gte("created_at", fromFilter);
    if (toFilter) oppsQ = oppsQ.lte("created_at", toFilter);

    // Calls
    let callsQ = supabase.from("sales_calls").select("id", { count: "exact" }).eq("user_id", profile.id);
    if (fromFilter) callsQ = callsQ.gte("started_at", fromFilter);
    if (toFilter) callsQ = callsQ.lte("started_at", toFilter);

    // Follow-ups
    let fuQ = supabase.from("sales_follow_ups").select("id", { count: "exact" }).eq("assigned_to", profile.id);
    if (fromFilter) fuQ = fuQ.gte("created_at", fromFilter);
    if (toFilter) fuQ = fuQ.lte("created_at", toFilter);

    const [leadsRes, oppsRes, callsRes, fuRes] = await Promise.all([leadsQ, oppsQ, callsQ, fuQ]);

    const opps = oppsRes.data ?? [];
    const wonOpps = opps.filter((o) => o.stage === "closed_won");
    const lostOpps = opps.filter((o) => o.stage === "closed_lost");
    const openOpps = opps.filter((o) => !["closed_won", "closed_lost"].includes(o.stage));

    members.push({
      userId: profile.id,
      fullName: profile.full_name,
      email: profile.email,
      leadsAssigned: leadsRes.count ?? 0,
      opportunities: opps.length,
      wonOpportunities: wonOpps.length,
      lostOpportunities: lostOpps.length,
      pipelineValue: sumArray(openOpps.map((o) => Number(o.value) || 0)),
      wonRevenue: sumArray(wonOpps.map((o) => Number(o.value) || 0)),
      calls: callsRes.count ?? 0,
      followUps: fuRes.count ?? 0,
    });
  }

  return { members };
}

// ============================================================
// Client Analytics
// ============================================================

async function getClientMetrics(
  supabase: SupabaseClient,
  dateRange: DateRange
): Promise<ClientAnalytics> {
  const fromFilter = dateRange.from ? formatDateLocal(new Date(dateRange.from)) : null;
  const toFilter = dateRange.to ? formatDateLocal(new Date(new Date(dateRange.to).getTime() - 86400000)) : null;

  // Total & active clients
  const { count: totalClients } = await supabase.from("clients").select("id", { count: "exact" });
  const { count: activeClients } = await supabase.from("clients").select("id", { count: "exact" }).eq("status", "active");

  // New clients in period
  let newClientsQ = supabase.from("clients").select("id", { count: "exact" });
  if (fromFilter) newClientsQ = newClientsQ.gte("converted_at", fromFilter);
  if (toFilter) newClientsQ = newClientsQ.lte("converted_at", toFilter);
  const { count: newClients } = await newClientsQ;

  // Clients with active projects
  const { data: activeProjectClients } = await supabase
    .from("projects")
    .select("client_id")
    .in("status", ["planning", "active"]);
  const clientsWithActiveProjects = new Set((activeProjectClients ?? []).map((p) => p.client_id)).size;

  // Client revenue (payments through invoices)
  const { data: clientPayments } = await supabase
    .from("payments")
    .select("amount, invoices!inner(client_id, status)")
    .neq("invoices.status", "cancelled");
  const clientRevenueMap: Record<string, number> = {};
  for (const p of clientPayments ?? []) {
    const invoiceArr = (p as Record<string, unknown>).invoices as { client_id: string; status: string }[] | undefined;
    const clientId = invoiceArr?.[0]?.client_id;
    if (clientId) {
      clientRevenueMap[clientId] = (clientRevenueMap[clientId] || 0) + (Number(p.amount) || 0);
    }
  }
  const clientRevenue = sumArray(Object.values(clientRevenueMap));

  // Client outstanding
  const { data: outstandingInvoices } = await supabase
    .from("invoices")
    .select("client_id, balance_due, status")
    .neq("status", "cancelled")
    .gt("balance_due", 0);
  const clientOutstandingMap: Record<string, number> = {};
  for (const inv of outstandingInvoices ?? []) {
    clientOutstandingMap[inv.client_id] = (clientOutstandingMap[inv.client_id] || 0) + (Number(inv.balance_due) || 0);
  }
  const clientOutstanding = sumArray(Object.values(clientOutstandingMap));

  // Top clients by revenue
  const { data: allClients } = await supabase.from("clients").select("id, client_code, companies(name)");
  type ClientRow = { id: string; client_code: string; companies: { name: string }[] };

  const topRevenue: TopClient[] = Object.entries(clientRevenueMap)
    .map(([clientId, revenue]) => {
      const client = (allClients ?? []).find((c: ClientRow) => c.id === clientId);
      return {
        clientId,
        clientCode: client?.client_code || "",
        companyName: (client as ClientRow | undefined)?.companies?.[0]?.name || null,
        revenue,
        outstanding: clientOutstandingMap[clientId] || 0,
        projectCount: 0,
      };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Top clients by outstanding
  const topOutstanding: TopClient[] = Object.entries(clientOutstandingMap)
    .map(([clientId, outstanding]) => {
      const client = (allClients ?? []).find((c: ClientRow) => c.id === clientId);
      return {
        clientId,
        clientCode: client?.client_code || "",
        companyName: (client as ClientRow | undefined)?.companies?.[0]?.name || null,
        revenue: clientRevenueMap[clientId] || 0,
        outstanding,
        projectCount: 0,
      };
    })
    .sort((a, b) => b.outstanding - a.outstanding)
    .slice(0, 10);

  // Top clients by project count
  const projectCountMap: Record<string, number> = {};
  for (const p of activeProjectClients ?? []) {
    projectCountMap[p.client_id] = (projectCountMap[p.client_id] || 0) + 1;
  }
  // Also count completed projects
  const { data: allProjectClients } = await supabase.from("projects").select("client_id");
  for (const p of allProjectClients ?? []) {
    projectCountMap[p.client_id] = (projectCountMap[p.client_id] || 0) + 1;
  }
  const topProjects: TopClient[] = Object.entries(projectCountMap)
    .map(([clientId, projectCount]) => {
      const client = (allClients ?? []).find((c: ClientRow) => c.id === clientId);
      return {
        clientId,
        clientCode: client?.client_code || "",
        companyName: (client as ClientRow | undefined)?.companies?.[0]?.name || null,
        revenue: clientRevenueMap[clientId] || 0,
        outstanding: clientOutstandingMap[clientId] || 0,
        projectCount,
      };
    })
    .sort((a, b) => b.projectCount - a.projectCount)
    .slice(0, 10);

  return {
    totalClients: totalClients ?? 0,
    newClients: newClients ?? 0,
    activeClients: activeClients ?? 0,
    clientsWithActiveProjects,
    clientRevenue,
    clientOutstanding,
    topClientsByRevenue: topRevenue,
    topClientsByOutstanding: topOutstanding,
    topClientsByProjects: topProjects,
  };
}

// ============================================================
// Project Analytics
// ============================================================

async function getProjectMetrics(
  supabase: SupabaseClient,
  dateRange: DateRange
): Promise<ProjectAnalytics> {
  const fromFilter = dateRange.from ? formatDateLocal(new Date(dateRange.from)) : null;
  const toFilter = dateRange.to ? formatDateLocal(new Date(new Date(dateRange.to).getTime() - 86400000)) : null;
  const today = formatDateLocal(new Date());

  // Projects
  let projectsQuery = supabase.from("projects").select("id, status, target_end_date, completed_at, created_at");
  if (fromFilter) projectsQuery = projectsQuery.gte("created_at", fromFilter);
  if (toFilter) projectsQuery = projectsQuery.lte("created_at", toFilter);

  const { data: projects } = await projectsQuery;

  const allProjects = projects ?? [];
  const activeProjects = allProjects.filter((p) => ["planning", "active", "on_hold"].includes(p.status));
  const completedProjects = allProjects.filter((p) => p.status === "completed");
  const delayedProjects = allProjects.filter(
    (p) => p.target_end_date && p.target_end_date < today && p.status !== "completed" && p.status !== "cancelled"
  );

  // Milestones
  const projectIds = allProjects.map((p) => p.id);
  let milestonesQuery = supabase.from("project_milestones").select("id, status, project_id");
  if (projectIds.length > 0) {
    milestonesQuery = milestonesQuery.in("project_id", projectIds);
  }
  const { data: milestones } = await milestonesQuery;
  const allMilestones = milestones ?? [];
  const completedMilestones = allMilestones.filter((m) => m.status === "completed");
  const milestoneCompletion = safeRate(completedMilestones.length, allMilestones.length);

  // Tasks
  let tasksQuery = supabase.from("tasks").select("id, status, project_id");
  if (projectIds.length > 0) {
    tasksQuery = tasksQuery.in("project_id", projectIds);
  }
  const { data: tasks } = await tasksQuery;
  const allTasks = tasks ?? [];
  const completedTasks = allTasks.filter((t) => t.status === "completed");
  const taskCompletion = safeRate(completedTasks.length, allTasks.length);

  // Project billing (sum of invoices for these projects)
  let billingQuery = supabase.from("invoices").select("total_amount, project_id, status").neq("status", "cancelled");
  if (projectIds.length > 0) {
    billingQuery = billingQuery.in("project_id", projectIds);
  }
  const { data: billingInvoices } = await billingQuery;
  const projectBilling = sumArray((billingInvoices ?? []).map((i) => Number(i.total_amount) || 0));

  // Trends
  const periods = fromFilter && toFilter
    ? generateMonthPeriods(formatDateLocal(new Date(dateRange.from!)), formatDateLocal(new Date(new Date(dateRange.to!).getTime() - 86400000)))
    : [];
  const projectsByMonth: Record<string, number> = {};
  for (const p of allProjects) {
    const key = getMonthKey(p.created_at);
    projectsByMonth[key] = (projectsByMonth[key] || 0) + 1;
  }
  const trends: PeriodTrend[] = periods.map((p) => ({
    period: p,
    value: projectsByMonth[p] || 0,
  }));

  return {
    totalProjects: allProjects.length,
    activeProjects: activeProjects.length,
    completedProjects: completedProjects.length,
    delayedProjects: delayedProjects.length,
    milestoneCompletion,
    taskCompletion,
    projectBilling,
    trends,
  };
}

// ============================================================
// Team Analytics
// ============================================================

async function getTeamMetrics(
  supabase: SupabaseClient,
  dateRange: DateRange
): Promise<TeamAnalytics> {
  const fromFilter = dateRange.from ? formatDateLocal(new Date(dateRange.from)) : null;
  const toFilter = dateRange.to ? formatDateLocal(new Date(new Date(dateRange.to).getTime() - 86400000)) : null;
  const today = formatDateLocal(new Date());

  // Get all active users
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("is_active", true);

  const members: TeamMember[] = [];
  let totalAssigned = 0;
  let totalCompleted = 0;
  let totalOverdue = 0;

  for (const profile of profiles ?? []) {
    // Tasks assigned to this user
    let tasksQ = supabase.from("tasks").select("id, status, due_date, created_at");
    tasksQ = tasksQ.eq("assigned_to", profile.id);
    if (fromFilter) tasksQ = tasksQ.gte("created_at", fromFilter);
    if (toFilter) tasksQ = tasksQ.lte("created_at", toFilter);

    const { data: tasks } = await tasksQ;
    const allTasks = tasks ?? [];
    const completed = allTasks.filter((t) => t.status === "completed").length;
    const active = allTasks.filter((t) => !["completed", "cancelled"].includes(t.status));
    const overdue = active.filter((t) => t.due_date && t.due_date < today).length;

    totalAssigned += allTasks.length;
    totalCompleted += completed;
    totalOverdue += overdue;

    members.push({
      userId: profile.id,
      fullName: profile.full_name,
      email: profile.email,
      assignedTasks: allTasks.length,
      completedTasks: completed,
      overdueTasks: overdue,
      completionRate: safeRate(completed, allTasks.length),
      activeWorkload: active.length,
    });
  }

  return {
    members,
    totalAssignedTasks: totalAssigned,
    totalCompletedTasks: totalCompleted,
    totalOverdueTasks: totalOverdue,
    overallCompletionRate: safeRate(totalCompleted, totalAssigned),
  };
}

// ============================================================
// Time Series
// ============================================================

async function getTimeSeries(
  supabase: SupabaseClient,
  dateRange: DateRange
): Promise<TimeSeriesData> {
  const fromFilter = dateRange.from ? formatDateLocal(new Date(dateRange.from)) : null;
  const toFilter = dateRange.to ? formatDateLocal(new Date(new Date(dateRange.to).getTime() - 86400000)) : null;

  const periods = fromFilter && toFilter
    ? generateMonthPeriods(formatDateLocal(new Date(dateRange.from!)), formatDateLocal(new Date(new Date(dateRange.to!).getTime() - 86400000)))
    : [];

  // Revenue
  let paymentsQ = supabase
    .from("payments")
    .select("amount, payment_date, invoices!inner(status)")
    .neq("invoices.status", "cancelled");
  if (fromFilter) paymentsQ = paymentsQ.gte("payment_date", fromFilter);
  if (toFilter) paymentsQ = paymentsQ.lte("payment_date", toFilter);

  // Leads
  let leadsQ = supabase.from("leads").select("created_at").is("archived_at", null);
  if (fromFilter) leadsQ = leadsQ.gte("created_at", fromFilter);
  if (toFilter) leadsQ = leadsQ.lte("created_at", toFilter);

  // Opportunities
  let oppsQ = supabase.from("sales_opportunities").select("created_at, value, stage");
  if (fromFilter) oppsQ = oppsQ.gte("created_at", fromFilter);
  if (toFilter) oppsQ = oppsQ.lte("created_at", toFilter);

  // Expenses
  let expensesQ = supabase.from("expenses").select("amount, expense_date").eq("status", "recorded");
  if (fromFilter) expensesQ = expensesQ.gte("expense_date", fromFilter);
  if (toFilter) expensesQ = expensesQ.lte("expense_date", toFilter);

  const [paymentsRes, leadsRes, oppsRes, expensesRes] = await Promise.all([
    paymentsQ, leadsQ, oppsQ, expensesQ,
  ]);

  const paymentsData = paymentsRes.data ?? [];
  const leadsData = leadsRes.data ?? [];
  const oppsData = oppsRes.data ?? [];
  const expensesData = expensesRes.data ?? [];

  // Build maps
  const revenueMap: Record<string, number> = {};
  for (const p of paymentsData) {
    const key = getMonthKey(p.payment_date);
    revenueMap[key] = (revenueMap[key] || 0) + (Number(p.amount) || 0);
  }

  const leadsMap: Record<string, number> = {};
  for (const l of leadsData) {
    const key = getMonthKey(l.created_at);
    leadsMap[key] = (leadsMap[key] || 0) + 1;
  }

  const oppsMap: Record<string, number> = {};
  for (const o of oppsData) {
    const key = getMonthKey(o.created_at);
    oppsMap[key] = (oppsMap[key] || 0) + 1;
  }

  const expensesMap: Record<string, number> = {};
  for (const e of expensesData) {
    const key = getMonthKey(e.expense_date);
    expensesMap[key] = (expensesMap[key] || 0) + (Number(e.amount) || 0);
  }

  const revenue: PeriodTrend[] = periods.map((p) => ({ period: p, value: revenueMap[p] || 0 }));
  const payments: PeriodTrend[] = [...revenue];
  const expenses: PeriodTrend[] = periods.map((p) => ({ period: p, value: expensesMap[p] || 0 }));
  const leadsTrends: PeriodTrend[] = periods.map((p) => ({ period: p, value: leadsMap[p] || 0 }));
  const opportunities: PeriodTrend[] = periods.map((p) => ({ period: p, value: oppsMap[p] || 0 }));

  return { revenue, payments, expenses, leads: leadsTrends, opportunities };
}

// ============================================================
// Sales Funnel
// ============================================================

async function getSalesFunnel(
  supabase: SupabaseClient,
  dateRange: DateRange
): Promise<SalesFunnel> {
  const fromFilter = dateRange.from ? formatDateLocal(new Date(dateRange.from)) : null;
  const toFilter = dateRange.to ? formatDateLocal(new Date(new Date(dateRange.to).getTime() - 86400000)) : null;

  // Count leads by status for funnel
  let leadsQ = supabase.from("leads").select("status, estimated_value").is("archived_at", null);
  if (fromFilter) leadsQ = leadsQ.gte("created_at", fromFilter);
  if (toFilter) leadsQ = leadsQ.lte("created_at", toFilter);

  const { data: leads } = await leadsQ;

  const statusCounts: Record<string, { count: number; value: number }> = {};
  for (const l of leads ?? []) {
    if (!statusCounts[l.status]) statusCounts[l.status] = { count: 0, value: 0 };
    statusCounts[l.status].count += 1;
    statusCounts[l.status].value += Number(l.estimated_value) || 0;
  }

  // Funnel stages (based on lead_status enum)
  const stageOrder = ["new", "contacted", "interested", "meeting", "proposal", "negotiation", "won"];
  const stages: FunnelStage[] = stageOrder.map((stage) => ({
    stage: stage.charAt(0).toUpperCase() + stage.slice(1),
    count: statusCounts[stage]?.count || 0,
    value: statusCounts[stage]?.value || 0,
  }));

  return { stages };
}

// ============================================================
// Top Salespeople
// ============================================================

async function getTopSalespeople(
  supabase: SupabaseClient,
  dateRange: DateRange,
  limit: number = 10
): Promise<TopSalesperson[]> {
  const fromFilter = dateRange.from ? formatDateLocal(new Date(dateRange.from)) : null;
  const toFilter = dateRange.to ? formatDateLocal(new Date(new Date(dateRange.to).getTime() - 86400000)) : null;

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("is_active", true);

  const salespeople: TopSalesperson[] = [];

  for (const profile of profiles ?? []) {
    // Won opportunities
    let wonOppsQ = supabase
      .from("sales_opportunities")
      .select("id, value")
      .eq("owner_id", profile.id)
      .eq("stage", "closed_won");
    if (fromFilter) wonOppsQ = wonOppsQ.gte("created_at", fromFilter);
    if (toFilter) wonOppsQ = wonOppsQ.lte("created_at", toFilter);

    // All open opportunities for pipeline
    let openOppsQ = supabase
      .from("sales_opportunities")
      .select("id, value, stage")
      .eq("owner_id", profile.id)
      .not("stage", "in", "(closed_won,closed_lost)");
    if (fromFilter) openOppsQ = openOppsQ.gte("created_at", fromFilter);
    if (toFilter) openOppsQ = openOppsQ.lte("created_at", toFilter);

    // Calls
    let callsQ = supabase.from("sales_calls").select("id", { count: "exact" }).eq("user_id", profile.id);
    if (fromFilter) callsQ = callsQ.gte("started_at", fromFilter);
    if (toFilter) callsQ = callsQ.lte("started_at", toFilter);

    // Follow-ups
    let fuQ = supabase.from("sales_follow_ups").select("id", { count: "exact" }).eq("assigned_to", profile.id);
    if (fromFilter) fuQ = fuQ.gte("created_at", fromFilter);
    if (toFilter) fuQ = fuQ.lte("created_at", toFilter);

    const [wonRes, openRes, callsRes, fuRes] = await Promise.all([wonOppsQ, openOppsQ, callsQ, fuQ]);

    const wonOpps = wonRes.data ?? [];
    const openOpps = openRes.data ?? [];

    salespeople.push({
      userId: profile.id,
      fullName: profile.full_name,
      email: profile.email,
      wonRevenue: sumArray(wonOpps.map((o) => Number(o.value) || 0)),
      wonDeals: wonOpps.length,
      pipeline: sumArray(openOpps.map((o) => Number(o.value) || 0)),
      calls: callsRes.count ?? 0,
      followUps: fuRes.count ?? 0,
    });
  }

  return salespeople
    .sort((a, b) => b.wonRevenue - a.wonRevenue)
    .slice(0, limit);
}

// ============================================================
// Public API
// ============================================================

export async function getAnalyticsSummary(query: AnalyticsQuery): Promise<AnalyticsSummary> {
  const profile = await requirePermission(Permission.ANALYTICS_VIEW);
  const supabase = await createClient();
  const role = profile.role as UserRole;
  const userId = profile.id;
  const dateRange = computeDateRange(query.dateRange.preset, query.dateRange.from ?? undefined, query.dateRange.to ?? undefined);

  // Fetch all metrics in parallel
  const [
    finance,
    sales,
    clients,
    projects,
    team,
  ] = await Promise.all([
    getFinanceMetrics(supabase, dateRange, role, userId),
    getSalesMetrics(supabase, dateRange, role, userId),
    getClientMetrics(supabase, dateRange),
    getProjectMetrics(supabase, dateRange),
    getTeamMetrics(supabase, dateRange),
  ]);

  return {
    revenue: finance.revenue,
    invoicedValue: finance.invoicedValue,
    outstanding: finance.outstanding,
    overdue: finance.overdue,
    expenses: finance.expenses,
    netCashMovement: finance.netCashMovement,
    totalLeads: sales.totalLeads,
    newLeads: sales.newLeads,
    qualifiedLeads: sales.qualifiedLeads,
    openOpportunities: sales.openOpportunities,
    pipelineValue: sales.pipelineValue,
    wonOpportunities: sales.wonOpportunities,
    wonRevenue: sales.wonRevenue,
    activeClients: clients.activeClients,
    newClients: clients.newClients,
    activeProjects: projects.activeProjects,
    completedProjects: projects.completedProjects,
    openTasks: team.totalAssignedTasks - team.totalCompletedTasks,
    completedTasks: team.totalCompletedTasks,
    overdueTasks: team.totalOverdueTasks,
  };
}

export async function getAnalyticsSales(query: AnalyticsQuery): Promise<SalesAnalytics> {
  await requirePermission(Permission.ANALYTICS_VIEW);
  const supabase = await createClient();
  const profile = await requirePermission(Permission.ANALYTICS_VIEW);
  const dateRange = computeDateRange(query.dateRange.preset, query.dateRange.from ?? undefined, query.dateRange.to ?? undefined);
  return getSalesMetrics(supabase, dateRange, profile.role as UserRole, profile.id);
}

export async function getAnalyticsSalesTeam(query: AnalyticsQuery): Promise<SalesTeamAnalytics> {
  const profile = await requirePermission(Permission.ANALYTICS_VIEW);
  if (!isAdminOrManager(profile.role as UserRole)) {
    throw new Error("Unauthorized: sales team analytics requires admin or manager role");
  }
  const supabase = await createClient();
  const dateRange = computeDateRange(query.dateRange.preset, query.dateRange.from ?? undefined, query.dateRange.to ?? undefined);
  return getSalesTeamMetrics(supabase, dateRange);
}

export async function getAnalyticsClients(query: AnalyticsQuery): Promise<ClientAnalytics> {
  await requirePermission(Permission.ANALYTICS_VIEW);
  const supabase = await createClient();
  const dateRange = computeDateRange(query.dateRange.preset, query.dateRange.from ?? undefined, query.dateRange.to ?? undefined);
  return getClientMetrics(supabase, dateRange);
}

export async function getAnalyticsProjects(query: AnalyticsQuery): Promise<ProjectAnalytics> {
  await requirePermission(Permission.ANALYTICS_VIEW);
  const supabase = await createClient();
  const dateRange = computeDateRange(query.dateRange.preset, query.dateRange.from ?? undefined, query.dateRange.to ?? undefined);
  return getProjectMetrics(supabase, dateRange);
}

export async function getAnalyticsTeam(query: AnalyticsQuery): Promise<TeamAnalytics> {
  const profile = await requirePermission(Permission.ANALYTICS_VIEW);
  if (!isAdminOrManager(profile.role as UserRole)) {
    throw new Error("Unauthorized: team analytics requires admin or manager role");
  }
  const supabase = await createClient();
  const dateRange = computeDateRange(query.dateRange.preset, query.dateRange.from ?? undefined, query.dateRange.to ?? undefined);
  return getTeamMetrics(supabase, dateRange);
}

export async function getAnalyticsFinance(query: AnalyticsQuery): Promise<FinanceAnalytics> {
  const profile = await requirePermission(Permission.ANALYTICS_VIEW);
  if (!isAdminOrManager(profile.role as UserRole)) {
    throw new Error("Unauthorized: finance analytics requires admin or manager role");
  }
  const supabase = await createClient();
  const dateRange = computeDateRange(query.dateRange.preset, query.dateRange.from ?? undefined, query.dateRange.to ?? undefined);

  const [financeMetrics, financeTimeSeries] = await Promise.all([
    getFinanceMetrics(supabase, dateRange, profile.role as UserRole, profile.id),
    getFinanceTimeSeries(supabase, dateRange),
  ]);

  return {
    ...financeMetrics,
    ...financeTimeSeries,
  };
}

export async function getAnalyticsTimeSeries(query: AnalyticsQuery): Promise<TimeSeriesData> {
  await requirePermission(Permission.ANALYTICS_VIEW);
  const supabase = await createClient();
  const dateRange = computeDateRange(query.dateRange.preset, query.dateRange.from ?? undefined, query.dateRange.to ?? undefined);
  return getTimeSeries(supabase, dateRange);
}

export async function getAnalyticsFunnel(query: AnalyticsQuery): Promise<SalesFunnel> {
  await requirePermission(Permission.ANALYTICS_VIEW);
  const supabase = await createClient();
  const dateRange = computeDateRange(query.dateRange.preset, query.dateRange.from ?? undefined, query.dateRange.to ?? undefined);
  return getSalesFunnel(supabase, dateRange);
}

export async function getAnalyticsTopSalespeople(
  query: AnalyticsQuery,
  limit: number = 10
): Promise<TopSalesperson[]> {
  const profile = await requirePermission(Permission.ANALYTICS_VIEW);
  if (!isAdminOrManager(profile.role as UserRole)) {
    throw new Error("Unauthorized: top salespeople analytics requires admin or manager role");
  }
  const supabase = await createClient();
  const dateRange = computeDateRange(query.dateRange.preset, query.dateRange.from ?? undefined, query.dateRange.to ?? undefined);
  return getTopSalespeople(supabase, dateRange, limit);
}
