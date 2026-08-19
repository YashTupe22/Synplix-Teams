import {
  Users,
  TrendingUp,
  FolderKanban,
  CheckSquare,
  Clock,
  AlertCircle,
  Activity,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { SectionCard } from "@/components/section-card";
import { Badge } from "@/components/ui/badge";

const placeholderStats = [
  {
    title: "Active Clients",
    value: "24",
    description: "Demo data only",
    icon: <Users className="size-4" />,
    trend: { value: 12, isPositive: true },
  },
  {
    title: "Open Leads",
    value: "18",
    description: "Demo data only",
    icon: <TrendingUp className="size-4" />,
    trend: { value: 8, isPositive: true },
  },
  {
    title: "Active Projects",
    value: "7",
    description: "Demo data only",
    icon: <FolderKanban className="size-4" />,
    trend: { value: 3, isPositive: true },
  },
  {
    title: "Pending Tasks",
    value: "42",
    description: "Demo data only",
    icon: <CheckSquare className="size-4" />,
    trend: { value: 5, isPositive: false },
  },
];

const placeholderPriorities = [
  {
    id: 1,
    title: "Review Q3 sales pipeline",
    type: "Sales",
    time: "2 hours",
  },
  {
    id: 2,
    title: "Client meeting - Acme Corp",
    type: "CRM",
    time: "4 hours",
  },
  {
    id: 3,
    title: "Update project documentation",
    type: "Projects",
    time: "Tomorrow",
  },
];

const placeholderActivity = [
  {
    id: 1,
    action: "New lead created",
    module: "CRM",
    time: "5 min ago",
  },
  {
    id: 2,
    action: "Project milestone completed",
    module: "Projects",
    time: "1 hour ago",
  },
  {
    id: 3,
    action: "Invoice #1042 sent",
    module: "Finance",
    time: "3 hours ago",
  },
  {
    id: 4,
    action: "Task assigned to team member",
    module: "Tasks",
    time: "Yesterday",
  },
];

const placeholderPipeline = [
  { stage: "Lead", count: 18, color: "bg-blue-500" },
  { stage: "Qualified", count: 12, color: "bg-violet-500" },
  { stage: "Proposal", count: 7, color: "bg-amber-500" },
  { stage: "Negotiation", count: 4, color: "bg-emerald-500" },
  { stage: "Closed", count: 3, color: "bg-green-500" },
];

const placeholderProjects = [
  {
    name: "Website Redesign",
    status: "In Progress",
    progress: 65,
  },
  {
    name: "Mobile App v2",
    status: "Planning",
    progress: 20,
  },
  {
    name: "CRM Integration",
    status: "In Progress",
    progress: 45,
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Dashboard"
          description="Welcome back. Here's an overview of your business."
        />
        <Badge variant="secondary" className="text-xs">
          Phase 1 - Demo
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {placeholderStats.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            description={stat.description}
            icon={stat.icon}
            trend={stat.trend}
          />
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's Priorities */}
        <SectionCard
          title="Today's Priorities"
          description="Coming soon with real task data"
          className="lg:col-span-1"
        >
          <div className="space-y-3">
            {placeholderPriorities.map((priority) => (
              <div
                key={priority.id}
                className="flex items-center justify-between rounded-md border border-border p-3"
              >
                <div className="flex items-center gap-3">
                  <Clock className="size-4 text-muted-foreground" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium">{priority.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {priority.type}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {priority.time}
                </Badge>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Recent Activity */}
        <SectionCard
          title="Recent Activity"
          description="Coming soon with real activity feed"
          className="lg:col-span-2"
        >
          <div className="space-y-3">
            {placeholderActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <Activity className="size-4 text-muted-foreground" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.module}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {activity.time}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Second row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales Pipeline */}
        <SectionCard
          title="Sales Pipeline"
          description="Coming soon with CRM integration"
        >
          <div className="space-y-4">
            {placeholderPipeline.map((stage) => (
              <div key={stage.stage}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium">{stage.stage}</span>
                  <span className="text-muted-foreground">{stage.count} leads</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${stage.color}`}
                    style={{
                      width: `${(stage.count / 18) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Project Overview */}
        <SectionCard
          title="Project Overview"
          description="Coming soon with project management"
        >
          <div className="space-y-4">
            {placeholderProjects.map((project) => (
              <div
                key={project.name}
                className="flex items-center justify-between rounded-md border border-border p-3"
              >
                <div>
                  <p className="text-sm font-medium">{project.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {project.status}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{project.progress}%</p>
                  <div className="mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Placeholder notice */}
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center">
        <AlertCircle className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
        <h3 className="mt-3 text-sm font-medium">Phase 1 - Foundation Only</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          This dashboard shows placeholder data. CRM, Sales, Projects, Tasks,
          Finance, and other modules will be implemented in future phases.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <Badge variant="outline">Phase 2: Auth & RBAC</Badge>
          <Badge variant="outline">Phase 3: CRM & Sales</Badge>
          <Badge variant="outline">Phase 4: Projects & Tasks</Badge>
          <Badge variant="outline">Phase 5: Finance & Analytics</Badge>
        </div>
      </div>
    </div>
  );
}
