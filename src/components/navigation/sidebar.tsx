"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants";
import { hasPermission, type Permission } from "@/lib/authorization";
import {
  LayoutDashboard,
  Contact,
  TrendingUp,
  Building2,
  FolderKanban,
  CheckSquare,
  DollarSign,
  FileText,
  Users,
  BarChart3,
  Settings,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { logout } from "@/app/dashboard/logout/actions";
import type { Profile } from "@/types/database";

const iconMap = {
  LayoutDashboard,
  Contact,
  TrendingUp,
  Building2,
  FolderKanban,
  CheckSquare,
  DollarSign,
  FileText,
  Users,
  BarChart3,
  Settings,
};

interface SidebarProps {
  collapsed?: boolean;
  onNavigate?: () => void;
  user?: Profile;
}

export function Sidebar({ collapsed = false, onNavigate, user }: SidebarProps) {
  const pathname = typeof window !== "undefined" ? window.location.pathname : "/dashboard";

  const displayName = user?.full_name || user?.email?.split("@")[0] || "User";
  const displayEmail = user?.email || "user@synplix.com";
  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : displayName.charAt(0).toUpperCase();

  // Filter nav items based on user permissions
  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.permission) {
      return hasPermission(user, item.permission as Permission);
    }
    return true;
  });

  return (
    <nav
      className={cn(
        "flex h-full flex-col bg-sidebar text-sidebar-foreground",
        collapsed ? "w-16" : "w-64"
      )}
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div
        className={cn(
          "flex h-14 items-center border-b border-sidebar-border px-4",
          collapsed && "justify-center px-2"
        )}
      >
        <Link href="/dashboard" className="flex items-center gap-2" onClick={onNavigate}>
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-sm font-semibold">S</span>
          </div>
          {!collapsed && (
            <span className="text-sm font-medium tracking-tight">Synplix</span>
          )}
        </Link>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto px-2 py-3">
        <div className={cn("space-y-1", collapsed && "space-y-0.5")}>
          {visibleItems.map((item) => {
            const Icon = iconMap[item.icon];
            const isActive =
              pathname === item.href || pathname?.startsWith(item.href + "/");
            const isDisabled = item.disabled;

            const linkContent = (
              <Link
                href={isDisabled ? "#" : item.href}
                onClick={isDisabled ? undefined : onNavigate}
                className={cn(
                  "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-muted hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                  isDisabled && "cursor-not-allowed opacity-50",
                  collapsed && "justify-center px-2"
                )}
                aria-disabled={isDisabled}
                tabIndex={isDisabled ? -1 : undefined}
              >
                <Icon
                  className={cn(
                    "size-4 shrink-0",
                    isActive && "text-primary"
                  )}
                  aria-hidden="true"
                />
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate">{item.title}</span>
                    {"comingSoon" in item && item.comingSoon && (
                      <Badge
                        variant="secondary"
                        className="ml-auto text-[10px] font-medium"
                      >
                        Soon
                      </Badge>
                    )}
                    {isActive && (
                      <ChevronRight
                        className="ml-auto size-3 opacity-50"
                        aria-hidden="true"
                      />
                    )}
                  </>
                )}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger
                    render={<div />}
                    className="w-full"
                  >
                    {linkContent}
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {item.title}
                    {"comingSoon" in item && item.comingSoon && " (Coming Soon)"}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return <div key={item.href}>{linkContent}</div>;
          })}
        </div>
      </div>

      {/* Footer - User info + logout */}
      {!collapsed && (
        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 rounded-md px-3 py-2">
            <div className="flex size-8 items-center justify-center rounded-full bg-sidebar-accent text-xs font-medium text-sidebar-muted">
              {initials}
            </div>
            <div className="flex-1 truncate">
              <p className="text-sm font-medium text-sidebar-foreground">
                {displayName}
              </p>
              <p className="text-xs text-sidebar-muted truncate">
                {displayEmail}
              </p>
            </div>
            <form action={logout}>
              <button
                type="submit"
                className="flex size-7 items-center justify-center rounded-md text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                aria-label="Sign out"
              >
                <LogOut className="size-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </nav>
  );
}
