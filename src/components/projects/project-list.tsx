"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { PROJECT_STATUS_CONFIG, PROJECT_PRIORITY_CONFIG, type ProjectWithRelations, type PaginatedResult } from "@/types/clients";

interface ProjectListProps {
  initialData: PaginatedResult<ProjectWithRelations>;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ProjectList({ initialData }: ProjectListProps) {
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const fetchData = async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("page", String(page));

    const res = await fetch(`/api/projects?${params.toString()}`);
    if (res.ok) {
      const result = await res.json();
      setData(result);
    }
  };

  const handleSearch = () => {
    setPage(1);
    startTransition(() => fetchData());
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9"
              aria-label="Search projects"
            />
          </div>
          <Button variant="outline" size="sm" onClick={handleSearch} disabled={isPending}>
            Search
          </Button>
        </div>
        <Link href="/projects/new" className={buttonVariants({ size: "sm" })}>
          <Plus className="mr-1.5 size-3.5" />
          New Project
        </Link>
      </div>

      {isPending && !data.data.length ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : data.data.length === 0 ? (
        <EmptyState
          title="No projects found"
          description={search ? "Try adjusting your search." : "Create your first project to get started."}
        />
      ) : (
        <>
          <div className="hidden md:block overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm" role="grid">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Project</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Client</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Manager</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Priority</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Progress</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((project) => {
                  const statusCfg = PROJECT_STATUS_CONFIG[project.status];
                  const priorityCfg = PROJECT_PRIORITY_CONFIG[project.priority];
                  return (
                    <tr key={project.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/projects/${project.id}`} className="font-medium hover:underline">
                          {project.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">{project.project_code}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {project.client?.company?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {project.project_manager?.full_name ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={`text-xs ${statusCfg.color}`}>
                          {statusCfg.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs ${priorityCfg.color}`}>
                          {priorityCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${project.progress_percent}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{project.progress_percent}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {project.target_end_date ? formatDate(project.target_end_date) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="space-y-2 md:hidden">
            {data.data.map((project) => {
              const statusCfg = PROJECT_STATUS_CONFIG[project.status];
              const priorityCfg = PROJECT_PRIORITY_CONFIG[project.priority];
              return (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <Card className="hover:bg-muted/50 transition-colors">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0">
                          <p className="font-medium">{project.name}</p>
                          <p className="text-xs text-muted-foreground">{project.project_code}</p>
                        </div>
                        <Badge variant="outline" className={`shrink-0 text-[10px] ${statusCfg.color}`}>
                          {statusCfg.label}
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{project.client?.company?.name ?? "No client"}</span>
                        <span className={priorityCfg.color}>{priorityCfg.label}</span>
                      </div>
                      <div className="mt-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${project.progress_percent}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{project.progress_percent}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {data.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                Showing {(page - 1) * data.limit + 1}–
                {Math.min(page * data.limit, data.total)} of {data.total}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon-sm"
                  disabled={page === 1}
                  onClick={() => {
                    setPage((p) => p - 1);
                    startTransition(() => fetchData());
                  }}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="size-3.5" />
                </Button>
                <span className="px-2 text-xs text-muted-foreground">
                  {page} / {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon-sm"
                  disabled={page >= data.totalPages}
                  onClick={() => {
                    setPage((p) => p + 1);
                    startTransition(() => fetchData());
                  }}
                  aria-label="Next page"
                >
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
