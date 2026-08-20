// ============================================================
// Analytics Types
// ============================================================

// ── Date Range ──

export type DateRangePreset = "today" | "7d" | "30d" | "90d" | "month" | "year" | "custom";

export interface DateRange {
  preset: DateRangePreset;
  from: string | null;
  to: string | null;
}

export interface AnalyticsQuery {
  dateRange: DateRange;
}

// ── Summary ──

export interface AnalyticsSummary {
  revenue: number;
  invoicedValue: number;
  outstanding: number;
  overdue: number;
  expenses: number;
  netCashMovement: number;
  totalLeads: number;
  newLeads: number;
  qualifiedLeads: number;
  openOpportunities: number;
  pipelineValue: number;
  wonOpportunities: number;
  wonRevenue: number;
  activeClients: number;
  newClients: number;
  activeProjects: number;
  completedProjects: number;
  openTasks: number;
  completedTasks: number;
  overdueTasks: number;
}

// ── Sales Analytics ──

export interface SalesAnalytics {
  totalLeads: number;
  newLeads: number;
  qualifiedLeads: number;
  convertedLeads: number;
  openOpportunities: number;
  wonOpportunities: number;
  lostOpportunities: number;
  pipelineValue: number;
  wonRevenue: number;
  conversionRate: number;
  winRate: number;
  trends: PeriodTrend[];
}

// ── Sales Team Analytics ──

export interface SalesTeamMember {
  userId: string;
  fullName: string | null;
  email: string;
  leadsAssigned: number;
  opportunities: number;
  wonOpportunities: number;
  lostOpportunities: number;
  pipelineValue: number;
  wonRevenue: number;
  calls: number;
  followUps: number;
}

export interface SalesTeamAnalytics {
  members: SalesTeamMember[];
}

// ── Client Analytics ──

export interface ClientAnalytics {
  totalClients: number;
  newClients: number;
  activeClients: number;
  clientsWithActiveProjects: number;
  clientRevenue: number;
  clientOutstanding: number;
  topClientsByRevenue: TopClient[];
  topClientsByOutstanding: TopClient[];
  topClientsByProjects: TopClient[];
}

export interface TopClient {
  clientId: string;
  clientCode: string;
  companyName: string | null;
  revenue: number;
  outstanding: number;
  projectCount: number;
}

// ── Project Analytics ──

export interface ProjectAnalytics {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  delayedProjects: number;
  milestoneCompletion: number;
  taskCompletion: number;
  projectBilling: number;
  trends: PeriodTrend[];
}

// ── Team Analytics ──

export interface TeamMember {
  userId: string;
  fullName: string | null;
  email: string;
  assignedTasks: number;
  completedTasks: number;
  overdueTasks: number;
  completionRate: number;
  activeWorkload: number;
}

export interface TeamAnalytics {
  members: TeamMember[];
  totalAssignedTasks: number;
  totalCompletedTasks: number;
  totalOverdueTasks: number;
  overallCompletionRate: number;
}

// ── Finance Analytics ──

export interface FinanceAnalytics {
  invoicedValue: number;
  paymentsReceived: number;
  outstanding: number;
  overdue: number;
  expenses: number;
  netCashMovement: number;
  revenueByMonth: PeriodValue[];
  paymentsByMonth: PeriodValue[];
  expensesByMonth: PeriodValue[];
  outstandingByClient: ClientOutstanding[];
  revenueByClient: ClientRevenue[];
}

export interface PeriodValue {
  period: string;
  value: number;
}

export interface ClientOutstanding {
  clientId: string;
  clientCode: string;
  companyName: string | null;
  outstanding: number;
}

export interface ClientRevenue {
  clientId: string;
  clientCode: string;
  companyName: string | null;
  revenue: number;
}

// ── Time Series ──

export interface PeriodTrend {
  period: string;
  value: number;
}

export interface TimeSeriesData {
  revenue: PeriodTrend[];
  payments: PeriodTrend[];
  expenses: PeriodTrend[];
  leads: PeriodTrend[];
  opportunities: PeriodTrend[];
}

// ── Sales Funnel ──

export interface FunnelStage {
  stage: string;
  count: number;
  value: number;
}

export interface SalesFunnel {
  stages: FunnelStage[];
}

// ── Top Salespeople ──

export interface TopSalesperson {
  userId: string;
  fullName: string | null;
  email: string;
  wonRevenue: number;
  wonDeals: number;
  pipeline: number;
  calls: number;
  followUps: number;
}
