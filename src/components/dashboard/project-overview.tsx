"use client";

import { FolderKanban } from "lucide-react";
import { SectionCard } from "@/components/section-card";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProjectSummary } from "@/types/dashboard";
import Link from "next/link";

interface ProjectOverviewProps {
  projects: ProjectSummary[];
  loading?: boolean;
}

export function ProjectOverview({ projects, loading }: ProjectOverviewProps) {
  if (loading) {
    return (
      <SectionCard title="Project Overview" description="Loading projects...">
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between rounded-md border border-border p-3">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <div className="space-y-1.5 text-right">
                <Skeleton className="h-4 w-8 ml-auto" />
                <Skeleton className="h-1.5 w-20 rounded-full ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Project Overview"
      description="Active projects"
    >
      {projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="size-6" />}
          title="No active projects"
          description="Create a project to get started."
          className="py-8"
        />
      ) : (
        <div className="space-y-2">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="flex items-center justify-between rounded-md border border-border p-3 transition-colors hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{project.name}</p>
                <p className="text-xs text-muted-foreground">
                  {project.client ?? "No client"} · {project.status}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-medium">{project.progress}%</p>
                <div className="mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
