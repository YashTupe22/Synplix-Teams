"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  TaskWithRelations,
  TaskStatus,
  TaskPriority,
  TASK_STATUS_CONFIG,
  TASK_PRIORITY_CONFIG,
} from "@/types/tasks";
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  Circle,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
} from "lucide-react";

interface TaskListProps {
  tasks: TaskWithRelations[];
  total: number;
  page: number;
  totalPages: number;
  title: string;
  showProject?: boolean;
  showFilters?: boolean;
  currentFilters?: Record<string, string>;
}

export function TaskList({
  tasks,
  total,
  page,
  totalPages,
  title,
  showProject = true,
  showFilters = true,
  currentFilters = {},
}: TaskListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(currentFilters.search || "");
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  function updateParams(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateParams("search", search);
  }

  function getStatusIcon(status: TaskStatus) {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "blocked":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  }

  function isOverdue(task: TaskWithRelations) {
    if (!task.due_date) return false;
    const today = new Date().toISOString().split("T")[0];
    return (
      task.due_date < today &&
      task.status !== "completed" &&
      task.status !== "cancelled"
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{total} tasks</Badge>
          {isPending && (
            <span className="text-xs text-muted-foreground">Loading...</span>
          )}
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="outline" size="sm">
          Search
        </Button>
        {showFilters && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowFilterPanel(!showFilterPanel)}
          >
            <Filter className="h-4 w-4" />
          </Button>
        )}
      </form>

      {/* Filter Panel */}
      {showFilterPanel && showFilters && (
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <label className="block text-xs font-medium mb-1">Status</label>
                <select
                  value={currentFilters.status || ""}
                  onChange={(e) => updateParams("status", e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs"
                >
                  <option value="">All</option>
                  {(Object.entries(TASK_STATUS_CONFIG) as [TaskStatus, { label: string }][]).map(
                    ([value, config]) => (
                      <option key={value} value={value}>
                        {config.label}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">
                  Priority
                </label>
                <select
                  value={currentFilters.priority || ""}
                  onChange={(e) => updateParams("priority", e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs"
                >
                  <option value="">All</option>
                  {(
                    Object.entries(TASK_PRIORITY_CONFIG) as [
                      TaskPriority,
                      { label: string }
                    ][]
                  ).map(([value, config]) => (
                    <option key={value} value={value}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Due</label>
                <select
                  value={currentFilters.overdue || ""}
                  onChange={(e) => updateParams("overdue", e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs"
                >
                  <option value="">All</option>
                  <option value="true">Overdue</option>
                </select>
              </div>

              <div className="flex items-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    router.push(window.location.pathname);
                  }}
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task List */}
      {tasks.length === 0 ? (
        <div className="rounded-lg border border-border p-8 text-center">
          <p className="text-muted-foreground">No tasks found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <Link key={task.id} href={`/tasks/${task.id}`}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(task.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-sm truncate">
                          {task.title}
                        </h3>
                        {isOverdue(task) && (
                          <Badge variant="destructive" className="text-[10px]">
                            Overdue
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        {showProject && task.project && (
                          <span>
                            {task.project.project_code} - {task.project.name}
                          </span>
                        )}
                        {task.milestone && (
                          <span>/ {task.milestone.name}</span>
                        )}
                        {task.assignee && (
                          <span>
                            {task.assignee.full_name || task.assignee.email}
                          </span>
                        )}
                        {task.due_date && (
                          <span
                            className={isOverdue(task) ? "text-red-600" : ""}
                          >
                            Due{" "}
                            {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${TASK_PRIORITY_CONFIG[task.priority].color}`}
                      >
                        {TASK_PRIORITY_CONFIG[task.priority].label}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${TASK_STATUS_CONFIG[task.status].color}`}
                      >
                        {TASK_STATUS_CONFIG[task.status].label}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => updateParams("page", String(page - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => updateParams("page", String(page + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
