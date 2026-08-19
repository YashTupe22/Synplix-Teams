"use client";

import { useState, useTransition } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { CALL_OUTCOME_CONFIG, type CallWithRelations, type PaginatedResult } from "@/types/sales";

interface CallListProps {
  initialData: PaginatedResult<CallWithRelations>;
  isAdmin: boolean;
  isManager: boolean;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CallList({ initialData }: CallListProps) {
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const fetchData = async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("page", String(page));

    const res = await fetch(`/api/sales/calls?${params.toString()}`);
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
      {/* Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search calls..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9"
              aria-label="Search calls"
            />
          </div>
          <Button variant="outline" size="sm" onClick={handleSearch} disabled={isPending}>
            Search
          </Button>
        </div>
      </div>

      {/* Table / Cards */}
      {isPending && !data.data.length ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : data.data.length === 0 ? (
        <EmptyState
          title="No calls found"
          description={search ? "Try adjusting your search." : "Log your first call to get started."}
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm" role="grid">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Lead</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Contact</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">User</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Duration</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Outcome</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Notes</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((call) => {
                  const outcomeCfg = CALL_OUTCOME_CONFIG[call.outcome];
                  return (
                    <tr key={call.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium">{call.lead?.title ?? "—"}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {call.contact
                          ? `${call.contact.first_name} ${call.contact.last_name ?? ""}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {call.user?.full_name ?? call.user?.email ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(call.started_at)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs">
                        {formatDuration(call.duration_seconds)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={`text-xs ${outcomeCfg.color}`}>
                          {outcomeCfg.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">
                        {call.notes ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-2 md:hidden">
            {data.data.map((call) => {
              const outcomeCfg = CALL_OUTCOME_CONFIG[call.outcome];
              return (
                <Card key={call.id}>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{call.lead?.title ?? "—"}</p>
                        {call.contact && (
                          <p className="text-xs text-muted-foreground">
                            {call.contact.first_name} {call.contact.last_name ?? ""}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className={`shrink-0 text-[10px] ${outcomeCfg.color}`}>
                        {outcomeCfg.label}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatDate(call.started_at)}</span>
                      <span className="font-mono">{formatDuration(call.duration_seconds)}</span>
                    </div>
                    {call.notes && (
                      <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{call.notes}</p>
                    )}
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
