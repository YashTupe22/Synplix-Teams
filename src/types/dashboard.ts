import type { Profile } from "@/types/database";

// ──────────────────────────────────────────────
// Dashboard data contracts
// ──────────────────────────────────────────────

export interface KpiCard {
  id: string;
  title: string;
  value: string | number;
  description: string;
  icon: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  status: "available" | "coming-soon" | "empty";
  module: string;
}

export interface Priority {
  id: string;
  title: string;
  module: string;
  dueIn: string | null;
  icon: string;
  status: "pending" | "overdue" | "completed";
}

export interface Activity {
  id: string;
  actorEmail: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  description: string;
  timestamp: string;
  metadata: Record<string, unknown> | null;
}

export interface PipelineStage {
  id: string;
  name: string;
  count: number;
  color: string;
  status: "available" | "coming-soon";
}

export interface ProjectSummary {
  id: string;
  name: string;
  status: string;
  progress: number;
  client: string | null;
  deadline: string | null;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  href: string;
  enabled: boolean;
  permission: string | null;
  description: string;
}

export interface DashboardSummary {
  user: Profile;
  greeting: string;
  currentDate: string;
  kpis: KpiCard[];
  priorities: Priority[];
  recentActivity: Activity[];
  salesPipeline: PipelineStage[];
  projects: ProjectSummary[];
  quickActions: QuickAction[];
  stats: {
    totalKpis: number;
    availableKpis: number;
    totalPriorities: number;
    totalActivity: number;
  };
}
