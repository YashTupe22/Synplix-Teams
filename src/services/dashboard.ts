import { createClient } from "@/lib/supabase/server";
import { hasPermission, Permission } from "@/lib/authorization";
import type { Profile, UserRole } from "@/types/database";
import type {
  DashboardSummary,
  KpiCard,
  Activity,
  PipelineStage,
  QuickAction,
  Priority,
  ProjectSummary,
} from "@/types/dashboard";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

async function getCRMData(supabase: ReturnType<typeof createClient> extends Promise<infer R> ? R : never, role: UserRole, userId: string) {
  let leadQuery = supabase
    .from("leads")
    .select("id, status", { count: "exact" })
    .is("archived_at", null);

  if (role === "employee") {
    leadQuery = leadQuery.eq("assigned_to", userId);
  }

  const { count: totalLeads } = await leadQuery;

  const { data: statusData } = await supabase
    .from("leads")
    .select("status")
    .is("archived_at", null);

  const statusCounts: Record<string, number> = {};
  for (const row of statusData ?? []) {
    statusCounts[row.status] = (statusCounts[row.status] ?? 0) + 1;
  }

  return { totalLeads: totalLeads ?? 0, statusCounts };
}

function buildKpis(role: UserRole, crmData: { totalLeads: number; statusCounts: Record<string, number> }, salesData?: { totalOpen: number; pipelineValue: number; callsToday: number; followUpsToday: number; overdueFollowUps: number }, clientProjectData?: { activeClients: number; activeProjects: number; upcomingDeadlines: number }, taskData?: { total: number; todo: number; inProgress: number; blocked: number; overdue: number; dueToday: number; completed: number }, financeData?: { revenueThisMonth: number; outstanding: number; overdue: number }): KpiCard[] {
  const baseKpis: KpiCard[] = [
    {
      id: "tasks",
      title: "My Tasks",
      value: taskData?.total ?? 0,
      description: taskData?.overdue ? `${taskData.overdue} overdue` : `${taskData?.inProgress ?? 0} in progress`,
      icon: "CheckSquare",
      status: taskData?.overdue ? "empty" : "available",
      module: "tasks",
    },
  ];

  const managerKpis: KpiCard[] = [
    {
      id: "leads",
      title: "Open Leads",
      value: crmData.totalLeads,
      description: "Active leads in pipeline",
      icon: "TrendingUp",
      status: "available",
      module: "crm",
      trend: crmData.statusCounts["new"] ? { value: crmData.statusCounts["new"], isPositive: true } : undefined,
    },
    {
      id: "pipeline",
      title: "Pipeline Value",
      value: salesData ? `₹${(salesData.pipelineValue / 1000).toFixed(0)}K` : "₹0",
      description: `${salesData?.totalOpen ?? 0} open opportunities`,
      icon: "DollarSign",
      status: "available",
      module: "sales",
    },
    {
      id: "calls-today",
      title: "Calls Today",
      value: salesData?.callsToday ?? 0,
      description: "Scheduled calls",
      icon: "Phone",
      status: "available",
      module: "sales",
    },
    {
      id: "follow-ups",
      title: "Follow-ups Today",
      value: salesData?.followUpsToday ?? 0,
      description: salesData?.overdueFollowUps ? `${salesData.overdueFollowUps} overdue` : "All on track",
      icon: "Clock",
      status: salesData?.overdueFollowUps ? "empty" : "available",
      module: "sales",
    },
    {
      id: "active-clients",
      title: "Active Clients",
      value: clientProjectData?.activeClients ?? 0,
      description: "Client relationships",
      icon: "Building2",
      status: "available",
      module: "clients",
    },
    {
      id: "active-projects",
      title: "Active Projects",
      value: clientProjectData?.activeProjects ?? 0,
      description: clientProjectData?.upcomingDeadlines ? `${clientProjectData.upcomingDeadlines} nearing deadline` : "All on track",
      icon: "FolderKanban",
      status: clientProjectData?.upcomingDeadlines ? "empty" : "available",
      module: "projects",
    },
    ...baseKpis,
  ];

  const adminKpis: KpiCard[] = [
    {
      id: "revenue",
      title: "Revenue This Month",
      value: financeData?.revenueThisMonth ? `₹${(financeData.revenueThisMonth / 1000).toFixed(0)}K` : "₹0",
      description: "Payments received",
      icon: "DollarSign",
      status: "available",
      module: "finance",
    },
    ...managerKpis,
    {
      id: "payments",
      title: "Outstanding",
      value: financeData?.outstanding ? `₹${(financeData.outstanding / 1000).toFixed(0)}K` : "₹0",
      description: financeData?.overdue ? `₹${(financeData.overdue / 1000).toFixed(0)}K overdue` : "All on track",
      icon: "Clock",
      status: financeData?.overdue ? "empty" : "available",
      module: "finance",
    },
  ];

  switch (role) {
    case "admin":
      return adminKpis;
    case "manager":
      return managerKpis;
    case "employee":
    default:
      return [
        {
          id: "leads",
          title: "My Leads",
          value: crmData.totalLeads,
          description: "Assigned to me",
          icon: "TrendingUp",
          status: "available",
          module: "crm",
        },
        {
          id: "calls-today",
          title: "Calls Today",
          value: salesData?.callsToday ?? 0,
          description: "Scheduled calls",
          icon: "Phone",
          status: "available",
          module: "sales",
        },
        {
          id: "active-projects",
          title: "My Projects",
          value: clientProjectData?.activeProjects ?? 0,
          description: "Assigned to me",
          icon: "FolderKanban",
          status: "available",
          module: "projects",
        },
        ...baseKpis,
      ];
  }
}

function buildQuickActions(role: UserRole): QuickAction[] {
  const allActions: QuickAction[] = [
    {
      id: "add-lead",
      label: "Add Lead",
      icon: "TrendingUp",
      href: "/crm/leads/new",
      enabled: true,
      permission: Permission.CRM_MANAGE,
      description: "Create a new lead in the CRM",
    },
    {
      id: "create-opportunity",
      label: "Create Opportunity",
      icon: "DollarSign",
      href: "/sales/opportunities/new",
      enabled: true,
      permission: Permission.SALES_MANAGE,
      description: "Create a new sales opportunity",
    },
    {
      id: "log-call",
      label: "Log Call",
      icon: "Phone",
      href: "/sales/calls",
      enabled: true,
      permission: Permission.SALES_MANAGE,
      description: "Log a sales call",
    },
    {
      id: "add-client",
      label: "Add Client",
      icon: "Building2",
      href: "/clients/new",
      enabled: true,
      permission: Permission.CLIENTS_MANAGE,
      description: "Convert a WON opportunity to a client",
    },
    {
      id: "create-project",
      label: "Create Project",
      icon: "FolderKanban",
      href: "/projects/new",
      enabled: true,
      permission: Permission.PROJECTS_MANAGE,
      description: "Create a new project for a client",
    },
    {
      id: "create-task",
      label: "Create Task",
      icon: "CheckSquare",
      href: "/tasks/new",
      enabled: true,
      permission: Permission.TASKS_MANAGE,
      description: "Create a new task",
    },
    {
      id: "create-quotation",
      label: "Create Quotation",
      icon: "FileText",
      href: "/finance/quotations/new",
      enabled: true,
      permission: Permission.FINANCE_MANAGE,
      description: "Create a new quotation for a client",
    },
  ];

  return allActions.filter((action) => {
    if (!action.permission) return true;
    const fakeProfile = { role, is_active: true } as Profile;
    return hasPermission(fakeProfile, action.permission as Permission);
  });
}

function buildPipeline(statusCounts: Record<string, number>): PipelineStage[] {
  const stages: { id: string; name: string; color: string }[] = [
    { id: "new", name: "New", color: "bg-blue-500" },
    { id: "contacted", name: "Contacted", color: "bg-violet-500" },
    { id: "interested", name: "Interested", color: "bg-amber-500" },
    { id: "meeting", name: "Meeting", color: "bg-orange-500" },
    { id: "proposal", name: "Proposal", color: "bg-emerald-500" },
    { id: "negotiation", name: "Negotiation", color: "bg-teal-500" },
    { id: "won", name: "Won", color: "bg-green-500" },
    { id: "lost", name: "Lost", color: "bg-red-500" },
  ];

  return stages.map((s) => ({
    ...s,
    count: statusCounts[s.id] ?? 0,
    status: "available" as const,
  }));
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.is_active) {
    throw new Error("Account inactive");
  }

  const role = profile.role as UserRole;

  // Fetch CRM data, sales data, client/project data, task data, finance data, recent activity, and project list in parallel
  const [crmData, salesResult, clientProjectResult, taskResult, financeResult, auditResult, projectsListResult] = await Promise.all([
    getCRMData(supabase, role, user.id),
    (role === "admin" || role === "manager" || role === "employee")
      ? supabase.from("sales_opportunities").select("stage, value, probability").then(async (oppRes) => {
          const opps = oppRes.data ?? [];
          const openOpps = opps.filter((o) => !["closed_won", "closed_lost"].includes(o.stage));
          const pipelineValue = openOpps.reduce((sum, o) => sum + (Number(o.value) || 0), 0);
          const totalOpen = openOpps.length;

          const now = new Date();
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
          const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

          let callsQ = supabase.from("sales_calls").select("id", { count: "exact" }).gte("started_at", todayStart).lt("started_at", tomorrowStart);
          let fuQ = supabase.from("sales_follow_ups").select("id", { count: "exact" }).gte("scheduled_at", todayStart).lt("scheduled_at", tomorrowStart).eq("status", "pending");
          let overdueQ = supabase.from("sales_follow_ups").select("id", { count: "exact" }).lt("scheduled_at", now.toISOString()).eq("status", "pending");

          if (role === "employee") {
            callsQ = callsQ.eq("user_id", user.id);
            fuQ = fuQ.eq("assigned_to", user.id);
            overdueQ = overdueQ.eq("assigned_to", user.id);
          }

          const [callsRes, fuRes, overdueRes] = await Promise.all([callsQ, fuQ, overdueQ]);

          return {
            totalOpen,
            pipelineValue,
            callsToday: callsRes.count ?? 0,
            followUpsToday: fuRes.count ?? 0,
            overdueFollowUps: overdueRes.count ?? 0,
          };
        })
      : Promise.resolve(undefined),
    // Client/Project data
    (role === "admin" || role === "manager" || role === "employee")
      ? (async () => {
          let clientsQuery = supabase
            .from("clients")
            .select("id", { count: "exact" })
            .eq("status", "active");

          let projectsQuery = supabase
            .from("projects")
            .select("id, target_end_date", { count: "exact" })
            .in("status", ["planning", "active"]);

          if (role === "employee") {
            clientsQuery = clientsQuery.or(`
              account_manager_id.eq.${user.id},
              EXISTS (
                SELECT 1 FROM public.projects p
                WHERE p.client_id = clients.id
                  AND (
                    p.project_manager_id = ${user.id}
                    OR EXISTS (
                      SELECT 1 FROM public.project_members pm
                      WHERE pm.project_id = p.id AND pm.user_id = ${user.id}
                    )
                  )
              )
            `);
            projectsQuery = projectsQuery.or(`
              project_manager_id.eq.${user.id},
              EXISTS (
                SELECT 1 FROM public.project_members pm
                WHERE pm.project_id = projects.id AND pm.user_id = ${user.id}
              )
            `);
          }

          const [clientsRes, projectsRes] = await Promise.all([clientsQuery, projectsQuery]);

          const now = new Date();
          const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
          const upcomingDeadlines = (projectsRes.data ?? []).filter(
            (p) => p.target_end_date && new Date(p.target_end_date) <= twoWeeksFromNow
          ).length;

          return {
            activeClients: clientsRes.count ?? 0,
            activeProjects: projectsRes.count ?? 0,
            upcomingDeadlines,
          };
        })()
      : Promise.resolve(undefined),
    // Task data
    (role === "admin" || role === "manager" || role === "employee")
      ? (async () => {
          const today = new Date().toISOString().split("T")[0];

          let taskQuery = supabase
            .from("tasks")
            .select("id, status, due_date, assigned_to, title, priority");

          if (role === "employee") {
            taskQuery = taskQuery.eq("assigned_to", user.id);
          }

          const { data: tasks } = await taskQuery;
          const allTasks = tasks || [];
          const activeTasks = allTasks.filter((t) => t.status !== "completed" && t.status !== "cancelled");

          return {
            total: allTasks.length,
            todo: allTasks.filter((t) => t.status === "todo").length,
            inProgress: allTasks.filter((t) => t.status === "in_progress").length,
            blocked: allTasks.filter((t) => t.status === "blocked").length,
            overdue: activeTasks.filter((t) => t.due_date && t.due_date < today).length,
            dueToday: activeTasks.filter((t) => t.due_date === today).length,
            completed: allTasks.filter((t) => t.status === "completed").length,
            allTasks,
          };
        })()
      : Promise.resolve(undefined),
    // Finance data (admin only)
    role === "admin"
      ? (async () => {
          const now = new Date();
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
          const today = now.toISOString().split("T")[0];

          const [paymentsRes, invoicesRes] = await Promise.all([
            supabase
              .from("payments")
              .select("amount")
              .gte("payment_date", monthStart)
              .lte("payment_date", monthEnd),
            supabase
              .from("invoices")
              .select("total_amount, balance_due, due_date, status")
              .neq("status", "cancelled"),
          ]);

          const payments = paymentsRes.data || [];
          const invoices = invoicesRes.data || [];

          const revenueThisMonth = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
          const outstanding = invoices
            .filter((i) => i.status !== "paid" && i.status !== "cancelled")
            .reduce((sum, i) => sum + (Number(i.balance_due) || 0), 0);
          const overdue = invoices
            .filter((i) => i.status !== "paid" && i.status !== "cancelled" && i.due_date && i.due_date < today)
            .reduce((sum, i) => sum + (Number(i.balance_due) || 0), 0);

          return { revenueThisMonth, outstanding, overdue };
        })()
      : Promise.resolve(undefined),
    // Audit logs (all users)
    supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(15),
    // Projects list for project overview
    (role === "admin" || role === "manager" || role === "employee")
      ? (async () => {
          let projectsQuery = supabase
            .from("projects")
            .select("id, name, status, progress_percent, target_end_date, client_id, clients(name, companies(name))");

          if (role === "employee") {
            projectsQuery = projectsQuery.or(`
              project_manager_id.eq.${user.id},
              EXISTS (
                SELECT 1 FROM public.project_members pm
                WHERE pm.project_id = projects.id AND pm.user_id = ${user.id}
              )
            `);
          }

          projectsQuery = projectsQuery.in("status", ["planning", "active", "on_hold"]).order("target_end_date", { ascending: true, nullsFirst: true }).limit(10);

          const { data } = await projectsQuery;
          return data ?? [];
        })()
      : Promise.resolve([]),
  ]);

  const recentActivity: Activity[] = (auditResult.data ?? []).map((log) => ({
    id: log.id,
    actorEmail: log.actor_email,
    action: formatAuditAction(log.action),
    targetType: log.target_id ? inferTargetType(log.action) : null,
    targetId: log.target_id,
    description: formatAuditDescription(log),
    timestamp: formatTimestamp(log.created_at),
    metadata: log.metadata,
  }));

  // Build priorities from actual tasks (overdue first, then due today, then upcoming)
  const today = new Date().toISOString().split("T")[0];
  const allTasks = taskResult?.allTasks ?? [];
  const priorities: Priority[] = allTasks
    .filter((t) => t.status !== "completed" && t.status !== "cancelled")
    .sort((a, b) => {
      const aOverdue = a.due_date && a.due_date < today;
      const bOverdue = b.due_date && b.due_date < today;
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      const aDueToday = a.due_date === today;
      const bDueToday = b.due_date === today;
      if (aDueToday && !bDueToday) return -1;
      if (!aDueToday && bDueToday) return 1;
      if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      return 0;
    })
    .slice(0, 8)
    .map((t) => ({
      id: t.id,
      title: t.title,
      module: "tasks",
      icon: "CheckSquare",
      dueIn: t.due_date
        ? t.due_date < today
          ? "Overdue"
          : t.due_date === today
            ? "Due today"
            : `Due ${t.due_date}`
        : null,
      status: t.due_date && t.due_date < today
        ? "overdue"
        : t.status === "completed"
          ? "completed"
          : "pending" as const,
    }));

  // Build projects list for project overview
  const projectList: ProjectSummary[] = (projectsListResult ?? []).map((p: any) => ({
    id: p.id,
    name: p.name,
    status: p.status,
    progress: p.progress_percent ?? 0,
    client: p.clients?.companies?.name ?? p.clients?.name ?? null,
    deadline: p.target_end_date ?? null,
  }));

  // Build KPIs once (avoid triple-call)
  const kpis = buildKpis(role, crmData, salesResult, clientProjectResult, taskResult, financeResult);

  return {
    user: profile as Profile,
    greeting: getGreeting(),
    currentDate: formatDate(),
    kpis,
    priorities,
    recentActivity,
    salesPipeline: buildPipeline(crmData.statusCounts),
    projects: projectList,
    quickActions: buildQuickActions(role),
    stats: {
      totalKpis: kpis.length,
      availableKpis: kpis.filter((k) => k.status === "available").length,
      totalPriorities: priorities.length,
      totalActivity: recentActivity.length,
    },
  };
}

function formatAuditAction(action: string): string {
  const actionMap: Record<string, string> = {
    role_changed: "Role updated",
    user_activated: "User activated",
    user_deactivated: "User deactivated",
    profile_updated: "Profile updated",
    password_changed: "Password changed",
    lead_created: "Lead created",
    lead_updated: "Lead updated",
    lead_status_changed: "Lead status changed",
    lead_archived: "Lead archived",
    company_created: "Company created",
    company_updated: "Company updated",
    contact_created: "Contact created",
    contact_updated: "Contact updated",
    opportunity_created: "Opportunity created",
    opportunity_updated: "Opportunity updated",
    opportunity_won: "Opportunity won",
    opportunity_lost: "Opportunity lost",
    call_logged: "Call logged",
    follow_up_created: "Follow-up created",
    follow_up_completed: "Follow-up completed",
    follow_up_cancelled: "Follow-up cancelled",
    client_created: "Client created",
    client_converted: "Client converted from opportunity",
    client_updated: "Client updated",
    client_status_changed: "Client status changed",
    client_note_added: "Client note added",
    project_created: "Project created",
    project_updated: "Project updated",
    project_status_changed: "Project status changed",
    project_member_added: "Project member added",
    project_member_removed: "Project member removed",
    milestone_created: "Milestone created",
    milestone_completed: "Milestone completed",
    milestone_updated: "Milestone updated",
    task_created: "Task created",
    task_completed: "Task completed",
    task_status_changed: "Task status changed",
    task_assigned: "Task assigned",
    task_priority_changed: "Task priority changed",
    task_due_date_changed: "Task due date changed",
    task_deleted: "Task deleted",
    comment_created: "Comment added",
    quotation_created: "Quotation created",
    quotation_updated: "Quotation updated",
    quotation_sent: "Quotation sent",
    quotation_accepted: "Quotation accepted",
    quotation_rejected: "Quotation rejected",
    quotation_expired: "Quotation expired",
    quotation_cancelled: "Quotation cancelled",
    quotation_deleted: "Quotation deleted",
    invoice_created: "Invoice created",
    invoice_updated: "Invoice updated",
    invoice_sent: "Invoice sent",
    invoice_partially_paid: "Invoice partially paid",
    invoice_paid: "Invoice paid",
    invoice_overdue: "Invoice overdue",
    invoice_cancelled: "Invoice cancelled",
    payment_recorded: "Payment recorded",
    expense_created: "Expense created",
    expense_updated: "Expense updated",
    expense_cancelled: "Expense cancelled",
  };
  return actionMap[action] ?? action.replace(/_/g, " ");
}

function formatAuditDescription(log: {
  action: string;
  actor_email: string;
  target_email: string | null;
  metadata: Record<string, unknown> | null;
}): string {
  const actor = log.actor_email.split("@")[0];
  const meta = log.metadata as Record<string, string> | null;
  switch (log.action) {
    case "role_changed": {
      const oldRole = meta?.old_role ?? "unknown";
      const newRole = meta?.new_role ?? "unknown";
      return `${actor} changed role from ${oldRole} to ${newRole}`;
    }
    case "user_activated":
      return `${actor} activated ${log.target_email?.split("@")[0] ?? "a user"}`;
    case "user_deactivated":
      return `${actor} deactivated ${log.target_email?.split("@")[0] ?? "a user"}`;
    case "lead_created":
      return `${actor} created lead "${meta?.title ?? "unknown"}"`;
    case "lead_status_changed":
      return `${actor} changed lead status to ${meta?.new_status ?? "unknown"}`;
    case "company_created":
      return `${actor} created company "${meta?.name ?? "unknown"}"`;
    case "contact_created":
      return `${actor} created contact "${meta?.name ?? "unknown"}"`;
    case "opportunity_created":
      return `${actor} created opportunity "${meta?.title ?? "unknown"}"`;
    case "opportunity_won":
      return `${actor} won opportunity "${meta?.title ?? "unknown"}"`;
    case "opportunity_lost":
      return `${actor} lost opportunity "${meta?.title ?? "unknown"}"`;
    case "call_logged":
      return `${actor} logged a call (${meta?.outcome ?? "unknown"})`;
    case "follow_up_created":
      return `${actor} created follow-up "${meta?.title ?? "unknown"}"`;
    case "follow_up_completed":
      return `${actor} completed a follow-up`;
    case "client_created":
      return `${actor} created client "${meta?.client_code ?? "unknown"}"`;
    case "client_converted":
      return `${actor} converted opportunity to client "${meta?.client_code ?? "unknown"}"`;
    case "client_updated":
      return `${actor} updated client`;
    case "client_status_changed":
      return `${actor} changed client status to ${meta?.new_status ?? "unknown"}`;
    case "client_note_added":
      return `${actor} added a note to client`;
    case "project_created":
      return `${actor} created project "${meta?.name ?? "unknown"}"`;
    case "project_updated":
      return `${actor} updated project`;
    case "project_status_changed":
      return `${actor} changed project status to ${meta?.new_status ?? "unknown"}`;
    case "project_member_added":
      return `${actor} added a member to project`;
    case "project_member_removed":
      return `${actor} removed a member from project`;
    case "milestone_created":
      return `${actor} created milestone "${meta?.name ?? "unknown"}"`;
    case "milestone_completed":
      return `${actor} completed milestone "${meta?.name ?? "unknown"}"`;
    case "task_created":
      return `${actor} created task "${meta?.title ?? "unknown"}"`;
    case "task_completed":
      return `${actor} completed task "${meta?.title ?? "unknown"}"`;
    case "task_status_changed":
      return `${actor} changed task status to ${meta?.new_status ?? "unknown"}`;
    case "task_assigned":
      return `${actor} assigned task "${meta?.title ?? "unknown"}"`;
    case "task_priority_changed":
      return `${actor} changed task priority to ${meta?.new_priority ?? "unknown"}`;
    case "task_due_date_changed":
      return `${actor} changed task due date`;
    case "task_deleted":
      return `${actor} deleted task "${meta?.title ?? "unknown"}"`;
    case "comment_created":
      return `${actor} added a comment`;
    case "quotation_created":
      return `${actor} created quotation "${meta?.quotation_number ?? "unknown"}"`;
    case "quotation_accepted":
      return `${actor} accepted quotation "${meta?.quotation_number ?? "unknown"}"`;
    case "quotation_rejected":
      return `${actor} rejected quotation "${meta?.quotation_number ?? "unknown"}"`;
    case "quotation_cancelled":
      return `${actor} cancelled quotation "${meta?.quotation_number ?? "unknown"}"`;
    case "invoice_created":
      return `${actor} created invoice "${meta?.invoice_number ?? "unknown"}"`;
    case "invoice_paid":
      return `${actor} marked invoice "${meta?.invoice_number ?? "unknown"}" as paid`;
    case "invoice_cancelled":
      return `${actor} cancelled invoice "${meta?.invoice_number ?? "unknown"}"`;
    case "payment_recorded":
      return `${actor} recorded a payment of ₹${meta?.amount ?? "unknown"}`;
    case "expense_created":
      return `${actor} created expense "${meta?.title ?? "unknown"}"`;
    case "expense_cancelled":
      return `${actor} cancelled expense "${meta?.title ?? "unknown"}"`;
    default:
      return `${actor} performed ${log.action.replace(/_/g, " ")}`;
  }
}

function inferTargetType(action: string): string {
  if (action.includes("role") || action.includes("user")) return "user";
  if (action.includes("lead")) return "lead";
  if (action.includes("company")) return "company";
  if (action.includes("contact")) return "contact";
  if (action.includes("opportunity")) return "opportunity";
  if (action.includes("call")) return "call";
  if (action.includes("follow_up")) return "follow-up";
  if (action.includes("client")) return "client";
  if (action.includes("project")) return "project";
  if (action.includes("milestone")) return "milestone";
  if (action.includes("task")) return "task";
  if (action.includes("comment")) return "comment";
  if (action.includes("quotation")) return "quotation";
  if (action.includes("invoice")) return "invoice";
  if (action.includes("payment")) return "payment";
  if (action.includes("expense")) return "expense";
  return "unknown";
}

function formatTimestamp(iso: string): string {
  const now = new Date();
  const then = new Date(iso);
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return then.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
