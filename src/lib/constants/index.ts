export const SITE_CONFIG = {
  name: "Synplix Teams",
  description: "Internal business dashboard for Synplix Infotech Services",
  url: "https://synplix-teams.vercel.app",
} as const;

export type NavItemPermission = "crm.view" | "sales.view" | "clients.view" | "projects.view" | "tasks.view" | "tasks.manage" | "finance.view" | "documents.view" | "users.view" | "analytics.view" | "settings.manage";

export const NAV_ITEMS = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: "LayoutDashboard" as const,
    disabled: false,
    permission: null,
  },
  {
    title: "Team",
    href: "/team",
    icon: "Users" as const,
    disabled: false,
    permission: "users.view" as const,
  },
  {
    title: "CRM",
    href: "/crm",
    icon: "Contact" as const,
    disabled: false,
    permission: "crm.view" as const,
  },
  {
    title: "Sales",
    href: "/sales",
    icon: "TrendingUp" as const,
    disabled: false,
    permission: "sales.view" as const,
  },
  {
    title: "Clients",
    href: "/clients",
    icon: "Building2" as const,
    disabled: false,
    permission: "clients.view" as const,
  },
  {
    title: "Projects",
    href: "/projects",
    icon: "FolderKanban" as const,
    disabled: false,
    permission: "projects.view" as const,
  },
  {
    title: "Tasks",
    href: "/tasks",
    icon: "CheckSquare" as const,
    disabled: false,
    permission: "tasks.view" as const,
  },
  {
    title: "Finance",
    href: "/finance",
    icon: "DollarSign" as const,
    disabled: false,
    permission: "finance.view" as const,
  },
  {
    title: "Documents",
    href: "/documents",
    icon: "FileText" as const,
    disabled: true,
    comingSoon: true,
    permission: "documents.view" as const,
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: "BarChart3" as const,
    disabled: true,
    comingSoon: true,
    permission: "analytics.view" as const,
  },
  {
    title: "Settings",
    href: "/settings/notifications",
    icon: "Settings" as const,
    disabled: false,
    permission: "settings.manage" as const,
  },
] as const;
