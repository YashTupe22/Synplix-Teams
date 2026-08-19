"use client";

import { ActivityIcon, Shield, UserCog, UserCheck, UserX, type LucideIcon } from "lucide-react";
import { SectionCard } from "@/components/section-card";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { Activity as ActivityType } from "@/types/dashboard";

interface RecentActivityProps {
  activities: ActivityType[];
  loading?: boolean;
  isAdmin: boolean;
}

const actionIcons: Record<string, LucideIcon> = {
  "Role updated": Shield,
  "User activated": UserCheck,
  "User deactivated": UserX,
  "Profile updated": UserCog,
};

export function RecentActivity({ activities, loading, isAdmin }: RecentActivityProps) {
  if (loading) {
    return (
      <SectionCard title="Recent Activity" description="Loading activity...">
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
              <Skeleton className="size-4 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      </SectionCard>
    );
  }

  if (!isAdmin) {
    return (
      <SectionCard
        title="Recent Activity"
        description="Activity feed is admin-only"
      >
        <EmptyState
          icon={<ActivityIcon className="size-6" />}
          title="Admin access required"
          description="The activity feed shows system-wide actions and is available to administrators only."
        />
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Recent Activity"
      description={
        activities.length > 0
          ? `${activities.length} recent event${activities.length === 1 ? "" : "s"}`
          : "System activity will appear here"
      }
    >
      {activities.length === 0 ? (
        <EmptyState
          icon={<ActivityIcon className="size-6" />}
          title="No activity yet"
          description="System actions like role changes and user management will appear here."
        />
      ) : (
        <div className="space-y-0">
          {activities.map((activity) => {
            const Icon = actionIcons[activity.action] ?? ActivityIcon;
            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 border-b border-border py-3 last:border-0 last:pb-0 first:pt-0"
              >
                <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Icon className="size-3.5 text-muted-foreground" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{activity.description}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {activity.action}
                    {activity.targetType && ` · ${activity.targetType}`}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {activity.timestamp}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}
