import { requirePermission, Permission } from "@/lib/authorization-server";
import { getLeads, getCompanies, getContacts, getPipelineStats } from "@/services/crm";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import {
  TrendingUp,
  Building2,
  Users,
  Plus,
  ArrowRight,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { LEAD_STATUS_CONFIG } from "@/types/crm";
import type { LeadStatus } from "@/types/crm";

export const metadata = {
  title: "CRM | Synplix Teams",
};

export default async function CRMOverviewPage() {
  const profile = await requirePermission(Permission.CRM_VIEW);
  const [pipelineStats, leadsResult, companiesResult, contactsResult] = await Promise.all([
    getPipelineStats(profile),
    getLeads({ limit: 5, sort: "created_at", order: "desc" }, profile),
    getCompanies({ limit: 5 }),
    getContacts({ limit: 5 }),
  ]);

  const isAdmin = profile.role === "admin";
  const isManager = profile.role === "manager";

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="CRM"
          description="Manage your leads, companies, and contacts"
        />
        {(isAdmin || isManager) && (
          <Link href="/crm/leads/new" className={buttonVariants({ size: "sm" })}>
            <Plus className="mr-1.5 size-3.5" />
            New Lead
          </Link>
        )}
      </div>

      {/* Pipeline overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Leads</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{pipelineStats.total}</div>
            <p className="text-xs text-muted-foreground">Active pipeline</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Companies</CardTitle>
            <Building2 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{companiesResult.total}</div>
            <p className="text-xs text-muted-foreground">In database</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Contacts</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{contactsResult.total}</div>
            <p className="text-xs text-muted-foreground">In database</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">New Leads</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{pipelineStats.byStatus["new"] ?? 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting action</p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline by status */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-base">Pipeline by Status</CardTitle>
          <Link href="/crm/leads" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            View all <ArrowRight className="ml-1 size-3" />
          </Link>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(Object.keys(LEAD_STATUS_CONFIG) as LeadStatus[]).map((s) => (
              <div key={s} className="rounded-lg border border-border p-3">
                <div className="flex items-center gap-2">
                  <span className={`size-2 rounded-full ${LEAD_STATUS_CONFIG[s].bgColor}`} />
                  <span className="text-sm font-medium">{LEAD_STATUS_CONFIG[s].label}</span>
                </div>
                <p className="mt-1 text-2xl font-semibold">{pipelineStats.byStatus[s] ?? 0}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick links */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/crm/leads" className="group">
          <Card className="transition-colors group-hover:bg-muted/50">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <TrendingUp className="size-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Leads</p>
                <p className="text-xs text-muted-foreground">{leadsResult.total} leads</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/crm/companies" className="group">
          <Card className="transition-colors group-hover:bg-muted/50">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="size-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Companies</p>
                <p className="text-xs text-muted-foreground">{companiesResult.total} companies</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/crm/contacts" className="group">
          <Card className="transition-colors group-hover:bg-muted/50">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <Users className="size-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Contacts</p>
                <p className="text-xs text-muted-foreground">{contactsResult.total} contacts</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
