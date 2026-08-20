"use client";

import { useRouter } from "next/navigation";
import { RefreshCw, DollarSign, TrendingUp, Wallet, Users, FolderKanban, BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { KpiCard } from "@/components/analytics/kpi-card";
import { DateRangePicker } from "@/components/analytics/date-range-picker";
import { LazyRevenueTrendChart } from "@/components/analytics/charts/lazy-revenue-trend";
import { SalesFunnel } from "@/components/analytics/charts/sales-funnel";
import { LazyFinanceBarChart } from "@/components/analytics/charts/lazy-finance-bar";
import { LazyLeadsTrendChart } from "@/components/analytics/charts/lazy-leads-trend";
import { TopClientsTable } from "@/components/analytics/data-tables";
import { formatINR, formatPercent } from "@/lib/analytics-utils";
import type { DateRangePreset } from "@/types/analytics";
import type { UserRole } from "@/types/database";

interface AnalyticsContentProps {
  role: UserRole;
  initialData: {
    summary: any;
    sales: any;
    funnel: any;
    timeSeries: any;
    clients: any;
    projects: any;
    finance: any;
    team: any;
    salesTeam: any;
  };
  initialPreset: DateRangePreset;
}

export function AnalyticsContent({ role, initialData, initialPreset }: AnalyticsContentProps) {
  const router = useRouter();

  const { summary, sales, funnel, timeSeries, clients, projects, finance, team, salesTeam } = initialData;

  const isAdmin = role === "admin";
  const isManager = role === "manager";
  const canViewFinance = isAdmin || isManager;
  const canViewTeam = isAdmin || isManager;

  const handleDateChange = (preset: DateRangePreset) => {
    router.push(`/analytics?preset=${preset}`);
  };

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader title="Analytics" description="Business intelligence dashboard" />
        <div className="flex items-center gap-2">
          <DateRangePicker value={initialPreset} onChange={handleDateChange} />
          <Button variant="outline" size="icon-sm" onClick={handleRefresh} aria-label="Refresh analytics">
            <RefreshCw className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <section aria-label="Key performance indicators">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Revenue Received"
            value={formatINR(summary?.revenue ?? 0)}
            icon={DollarSign}
            description="Payments for non-cancelled invoices"
            href="/finance/payments"
          />
          <KpiCard
            title="Invoiced Value"
            value={formatINR(summary?.invoicedValue ?? 0)}
            icon={TrendingUp}
            description="Total invoiced amount"
            href="/finance/invoices"
          />
          <KpiCard
            title="Outstanding"
            value={formatINR(summary?.outstanding ?? 0)}
            icon={Wallet}
            description={summary?.overdue ? `${formatINR(summary.overdue)} overdue` : "All on track"}
            href="/finance/invoices"
          />
          <KpiCard
            title="Expenses"
            value={formatINR(summary?.expenses ?? 0)}
            icon={TrendingUp}
            description="Total recorded expenses"
            href="/finance/expenses"
          />
          <KpiCard
            title="Net Cash Movement"
            value={formatINR(summary?.netCashMovement ?? 0)}
            icon={BarChart3}
            description="Revenue minus expenses"
          />
          <KpiCard
            title="Pipeline Value"
            value={formatINR(summary?.pipelineValue ?? 0)}
            icon={TrendingUp}
            description={`${summary?.openOpportunities ?? 0} open opportunities`}
            href="/sales/pipeline"
          />
          <KpiCard
            title="Active Clients"
            value={summary?.activeClients ?? 0}
            icon={Users}
            description={`${summary?.newClients ?? 0} new this period`}
            href="/clients"
          />
          <KpiCard
            title="Active Projects"
            value={summary?.activeProjects ?? 0}
            icon={FolderKanban}
            description={`${summary?.completedProjects ?? 0} completed`}
            href="/projects"
          />
        </div>
      </section>

      <Separator />

      {/* Revenue Trend + Sales Funnel */}
      <section aria-label="Revenue and sales funnel">
        <div className="grid gap-6 lg:grid-cols-2">
          <LazyRevenueTrendChart
            revenue={timeSeries?.revenue ?? []}
            payments={timeSeries?.payments ?? []}
            expenses={timeSeries?.expenses ?? []}
          />
          <SalesFunnel stages={funnel?.stages ?? []} />
        </div>
      </section>

      {/* Sales Performance (admin/manager) */}
      {canViewTeam && salesTeam?.members?.length > 0 && (
        <section aria-label="Sales performance">
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-xs text-muted-foreground">
                  <th className="pb-2 pt-3 pl-4 pr-4 font-medium">Salesperson</th>
                  <th className="pb-2 pt-3 pr-4 font-medium text-right">Leads</th>
                  <th className="pb-2 pt-3 pr-4 font-medium text-right">Opps</th>
                  <th className="pb-2 pt-3 pr-4 font-medium text-right">Won</th>
                  <th className="pb-2 pt-3 pr-4 font-medium text-right">Pipeline</th>
                  <th className="pb-2 pt-3 pr-4 font-medium text-right">Revenue</th>
                  <th className="pb-2 pt-3 pr-4 font-medium text-right">Calls</th>
                  <th className="pb-2 pt-3 pr-4 font-medium text-right">Follow-ups</th>
                </tr>
              </thead>
              <tbody>
                {salesTeam.members.map((member: any) => (
                  <tr key={member.userId} className="border-b border-border/50 last:border-0">
                    <td className="py-2.5 pl-4 pr-4">
                      <div className="font-medium">{member.fullName || member.email.split("@")[0]}</div>
                      <div className="text-xs text-muted-foreground">{member.email}</div>
                    </td>
                    <td className="py-2.5 pr-4 text-right">{member.leadsAssigned}</td>
                    <td className="py-2.5 pr-4 text-right">{member.opportunities}</td>
                    <td className="py-2.5 pr-4 text-right">
                      <span className={member.wonOpportunities > 0 ? "text-emerald-500 font-medium" : ""}>
                        {member.wonOpportunities}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-right">{formatINR(member.pipelineValue)}</td>
                    <td className="py-2.5 pr-4 text-right font-medium">{formatINR(member.wonRevenue)}</td>
                    <td className="py-2.5 pr-4 text-right">{member.calls}</td>
                    <td className="py-2.5 pr-4 text-right">{member.followUps}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Finance Overview (admin/manager) */}
      {canViewFinance && finance && (
        <section aria-label="Finance overview">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <LazyFinanceBarChart
                revenueByMonth={finance.revenueByMonth ?? []}
                paymentsByMonth={finance.paymentsByMonth ?? []}
                expensesByMonth={finance.expensesByMonth ?? []}
              />
            </div>
            <div className="rounded-lg border border-border p-4">
              <h3 className="mb-4 text-sm font-medium">Finance Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Invoiced</span>
                  <span className="text-sm font-medium">{formatINR(finance.invoicedValue)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Received</span>
                  <span className="text-sm font-medium text-emerald-500">{formatINR(finance.paymentsReceived)}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Outstanding</span>
                  <span className="text-sm font-medium">{formatINR(finance.outstanding)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Overdue</span>
                  <span className="text-sm font-medium text-red-500">{formatINR(finance.overdue)}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Expenses</span>
                  <span className="text-sm font-medium text-red-500">{formatINR(finance.expenses)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Net Cash</span>
                  <span className={`text-sm font-medium ${finance.netCashMovement >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                    {formatINR(finance.netCashMovement)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Leads Trend */}
      <section aria-label="Leads and opportunities trend">
        <LazyLeadsTrendChart
          leads={timeSeries?.leads ?? []}
          opportunities={timeSeries?.opportunities ?? []}
        />
      </section>

      {/* Project Analytics */}
      {projects && (
        <section aria-label="Project analytics">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-border p-4">
              <p className="text-xs text-muted-foreground">Active Projects</p>
              <div className="mt-1 text-2xl font-semibold">{projects.activeProjects}</div>
              <p className="text-xs text-muted-foreground">of {projects.totalProjects} total</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-xs text-muted-foreground">Completed</p>
              <div className="mt-1 text-2xl font-semibold text-emerald-500">{projects.completedProjects}</div>
              <p className="text-xs text-muted-foreground">projects finished</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-xs text-muted-foreground">Delayed</p>
              <div className="mt-1 text-2xl font-semibold text-red-500">{projects.delayedProjects}</div>
              <p className="text-xs text-muted-foreground">past deadline</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-xs text-muted-foreground">Completion Rate</p>
              <div className="mt-1 text-2xl font-semibold">{formatPercent(projects.taskCompletion)}</div>
              <p className="text-xs text-muted-foreground">task completion</p>
            </div>
          </div>
        </section>
      )}

      {/* Client Analytics */}
      {clients && (
        <section aria-label="Client analytics">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border p-4">
              <p className="text-xs text-muted-foreground">Total Clients</p>
              <div className="mt-1 text-2xl font-semibold">{clients.totalClients}</div>
              <p className="text-xs text-muted-foreground">{clients.newClients} new this period</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-xs text-muted-foreground">Active Clients</p>
              <div className="mt-1 text-2xl font-semibold">{clients.activeClients}</div>
              <p className="text-xs text-muted-foreground">{clients.clientsWithActiveProjects} with active projects</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-xs text-muted-foreground">Outstanding</p>
              <div className="mt-1 text-2xl font-semibold">{formatINR(clients.clientOutstanding)}</div>
              <p className="text-xs text-muted-foreground">across all clients</p>
            </div>
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <TopClientsTable
              title="Top Clients by Revenue"
              clients={clients.topClientsByRevenue ?? []}
              valueKey="revenue"
              valueLabel="Revenue"
            />
            <TopClientsTable
              title="Top Clients by Outstanding"
              clients={clients.topClientsByOutstanding ?? []}
              valueKey="outstanding"
              valueLabel="Outstanding"
            />
            <TopClientsTable
              title="Top Clients by Projects"
              clients={clients.topClientsByProjects ?? []}
              valueKey="projectCount"
              valueLabel="Projects"
            />
          </div>
        </section>
      )}

      {/* Team Analytics (admin/manager) */}
      {canViewTeam && team && (
        <section aria-label="Team analytics">
          <div className="rounded-lg border border-border">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h3 className="text-sm font-medium">Team Performance</h3>
              <span className="text-xs text-muted-foreground">{team.members.length} members</span>
            </div>
            <div className="p-4">
              <div className="mb-6 grid gap-4 sm:grid-cols-4">
                <div className="text-center">
                  <div className="text-2xl font-semibold">{team.totalAssignedTasks}</div>
                  <p className="text-xs text-muted-foreground">Assigned Tasks</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-emerald-500">{team.totalCompletedTasks}</div>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-red-500">{team.totalOverdueTasks}</div>
                  <p className="text-xs text-muted-foreground">Overdue</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold">{formatPercent(team.overallCompletionRate)}</div>
                  <p className="text-xs text-muted-foreground">Completion Rate</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="pb-2 pr-4 font-medium">Member</th>
                      <th className="pb-2 pr-4 font-medium text-right">Assigned</th>
                      <th className="pb-2 pr-4 font-medium text-right">Completed</th>
                      <th className="pb-2 pr-4 font-medium text-right">Overdue</th>
                      <th className="pb-2 pr-4 font-medium text-right">Rate</th>
                      <th className="pb-2 font-medium text-right">Workload</th>
                    </tr>
                  </thead>
                  <tbody>
                    {team.members.map((member: any) => (
                      <tr key={member.userId} className="border-b border-border/50 last:border-0">
                        <td className="py-2.5 pr-4">
                          <div className="font-medium">{member.fullName || member.email.split("@")[0]}</div>
                          <div className="text-xs text-muted-foreground">{member.email}</div>
                        </td>
                        <td className="py-2.5 pr-4 text-right">{member.assignedTasks}</td>
                        <td className="py-2.5 pr-4 text-right text-emerald-500">{member.completedTasks}</td>
                        <td className="py-2.5 pr-4 text-right text-red-500">{member.overdueTasks}</td>
                        <td className="py-2.5 pr-4 text-right">{formatPercent(member.completionRate)}</td>
                        <td className="py-2.5 text-right">{member.activeWorkload}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Quick Summary */}
      <section aria-label="Quick summary">
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center">
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            <span>Leads: <strong className="text-foreground">{summary?.totalLeads ?? 0}</strong></span>
            <span>Won: <strong className="text-emerald-500">{summary?.wonOpportunities ?? 0}</strong></span>
            <span>Tasks: <strong className="text-foreground">{summary?.openTasks ?? 0}</strong> open</span>
            <span>Overdue Tasks: <strong className="text-red-500">{summary?.overdueTasks ?? 0}</strong></span>
          </div>
        </div>
      </section>
    </div>
  );
}
