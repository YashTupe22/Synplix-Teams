"use client";

import { useState, useTransition } from "react";
import { Search, CheckCircle2, XCircle, Clock, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FOLLOW_UP_STATUS_CONFIG,
  FOLLOW_UP_TYPE_CONFIG,
  type FollowUpWithRelations,
  type PaginatedResult,
} from "@/types/sales";

interface FollowUpListProps {
  initialData: PaginatedResult<FollowUpWithRelations>;
  isAdmin: boolean;
  isManager: boolean;
}

type TabFilter = "today" | "upcoming" | "overdue" | "completed";

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isToday(date: string): boolean {
  const d = new Date(date);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function isUpcoming(date: string): boolean {
  return new Date(date) > new Date();
}

function isOverdue(date: string): boolean {
  return new Date(date) < new Date();
}

export function FollowUpList({ initialData }: FollowUpListProps) {
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<TabFilter>("upcoming");

  const fetchData = async (params: Record<string, string> = {}) => {
    const searchParams = new URLSearchParams();
    if (search) searchParams.set("search", search);
    searchParams.set("page", String(page));
    Object.entries(params).forEach(([k, v]) => searchParams.set(k, v));

    const res = await fetch(`/api/sales/follow-ups?${searchParams.toString()}`);
    if (res.ok) {
      const result = await res.json();
      setData(result);
    }
  };

  const handleSearch = () => {
    setPage(1);
    startTransition(() => fetchData());
  };

  const handleTabChange = (tab: TabFilter) => {
    setActiveTab(tab);
    setPage(1);
  };

  const filteredData = data.data.filter((fu) => {
    if (fu.status === "completed" || fu.status === "cancelled") {
      return activeTab === "completed";
    }
    switch (activeTab) {
      case "today":
        return isToday(fu.scheduled_at);
      case "upcoming":
        return isUpcoming(fu.scheduled_at);
      case "overdue":
        return isOverdue(fu.scheduled_at);
      default:
        return true;
    }
  });

  const tabCounts = {
    today: data.data.filter((fu) => fu.status === "pending" && isToday(fu.scheduled_at)).length,
    upcoming: data.data.filter((fu) => fu.status === "pending" && isUpcoming(fu.scheduled_at)).length,
    overdue: data.data.filter((fu) => fu.status === "pending" && isOverdue(fu.scheduled_at)).length,
    completed: data.data.filter((fu) => fu.status === "completed" || fu.status === "cancelled").length,
  };

  const handleQuickAction = async (followUpId: string, action: "completed" | "cancelled") => {
    const res = await fetch(`/api/sales/follow-ups/${followUpId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: action }),
    });
    if (res.ok) {
      setData((prev) => ({
        ...prev,
        data: prev.data.map((fu) =>
          fu.id === followUpId ? { ...fu, status: action } : fu
        ),
      }));
    }
  };

  const tabs: { key: TabFilter; label: string; icon: React.ReactNode; count: number }[] = [
    { key: "today", label: "Today", icon: <Clock className="size-3.5" />, count: tabCounts.today },
    { key: "upcoming", label: "Upcoming", icon: <Clock className="size-3.5" />, count: tabCounts.upcoming },
    { key: "overdue", label: "Overdue", icon: <AlertTriangle className="size-3.5" />, count: tabCounts.overdue },
    { key: "completed", label: "Completed", icon: <CheckCircle2 className="size-3.5" />, count: tabCounts.completed },
  ];

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search follow-ups..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9"
              aria-label="Search follow-ups"
            />
          </div>
          <Button variant="outline" size="sm" onClick={handleSearch} disabled={isPending}>
            Search
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-border p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.count > 0 && (
              <Badge
                variant={activeTab === tab.key ? "secondary" : "outline"}
                className="ml-1 text-[10px]"
              >
                {tab.count}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {isPending && !data.data.length ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : filteredData.length === 0 ? (
        <EmptyState
          title="No follow-ups found"
          description={
            activeTab === "completed"
              ? "No completed follow-ups yet."
              : activeTab === "overdue"
                ? "No overdue follow-ups."
                : "Create your first follow-up to get started."
          }
        />
      ) : (
        <>
          <div className="space-y-2">
            {filteredData.map((fu) => {
              const typeCfg = FOLLOW_UP_TYPE_CONFIG[fu.type];
              const statusCfg = FOLLOW_UP_STATUS_CONFIG[fu.status];
              return (
                <Card key={fu.id} className="hover:bg-muted/50 transition-colors">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{fu.title}</p>
                          <Badge variant="outline" className={`shrink-0 text-[10px] ${statusCfg.color}`}>
                            {statusCfg.label}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {fu.lead?.title ?? "—"}
                          {typeCfg.label && ` · ${typeCfg.label}`}
                        </p>
                        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{formatDate(fu.scheduled_at)}</span>
                          {fu.assigned_user && (
                            <span>{fu.assigned_user.full_name ?? fu.assigned_user.email}</span>
                          )}
                        </div>
                      </div>
                      {fu.status === "pending" && (
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleQuickAction(fu.id, "completed")}
                            aria-label="Complete follow-up"
                          >
                            <CheckCircle2 className="size-3.5 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleQuickAction(fu.id, "cancelled")}
                            aria-label="Cancel follow-up"
                          >
                            <XCircle className="size-3.5 text-red-500" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
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
