"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LEAD_STATUS_CONFIG,
  LEAD_PRIORITY_CONFIG,
  type LeadWithRelations,
  type LeadStatus,
  type LeadPriority,
  type PaginatedResult,
} from "@/types/crm";

interface LeadsTableProps {
  initialData: PaginatedResult<LeadWithRelations>;
  isAdmin: boolean;
  isManager: boolean;
}

export function LeadsTable({ initialData, isAdmin, isManager }: LeadsTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<LeadPriority[]>([]);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const fetchData = async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter.length > 0) params.set("status", statusFilter.join(","));
    if (priorityFilter.length > 0) params.set("priority", priorityFilter.join(","));
    params.set("page", String(page));

    const res = await fetch(`/api/crm/leads?${params.toString()}`);
    if (res.ok) {
      const result = await res.json();
      setData(result);
    }
  };

  const handleSearch = () => {
    setPage(1);
    startTransition(() => fetchData());
  };

  const toggleStatus = (s: LeadStatus) => {
    setStatusFilter((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
    setPage(1);
    startTransition(() => fetchData());
  };

  const togglePriority = (p: LeadPriority) => {
    setPriorityFilter((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
    setPage(1);
    startTransition(() => fetchData());
  };

  const formatCurrency = (value: number | null, currency: string) => {
    if (value === null) return "—";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      {/* Search and filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9"
              aria-label="Search leads"
            />
          </div>
          <Button variant="outline" size="sm" onClick={handleSearch} disabled={isPending}>
            Search
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            aria-expanded={showFilters}
          >
            <Filter className="mr-1.5 size-3.5" />
            Filters
            {(statusFilter.length > 0 || priorityFilter.length > 0) && (
              <Badge variant="secondary" className="ml-1.5 text-[10px]">
                {statusFilter.length + priorityFilter.length}
              </Badge>
            )}
          </Button>
        </div>
        {(isAdmin || isManager) && (
          <Button size="sm" onClick={() => router.push("/crm/leads/new")}>
            <Plus className="mr-1.5 size-3.5" />
            New Lead
          </Button>
        )}
      </div>

      {/* Filter chips */}
      {showFilters && (
        <div className="space-y-3 rounded-lg border border-border p-3">
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Status</p>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(LEAD_STATUS_CONFIG) as LeadStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => toggleStatus(s)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                    statusFilter.includes(s)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {LEAD_STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Priority</p>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(LEAD_PRIORITY_CONFIG) as LeadPriority[]).map((p) => (
                <button
                  key={p}
                  onClick={() => togglePriority(p)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                    priorityFilter.includes(p)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {LEAD_PRIORITY_CONFIG[p].label}
                </button>
              ))}
            </div>
          </div>
          {(statusFilter.length > 0 || priorityFilter.length > 0) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter([]);
                setPriorityFilter([]);
                setPage(1);
                startTransition(() => fetchData());
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      )}

      {/* Table */}
      {isPending && !data.data.length ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : data.data.length === 0 ? (
        <EmptyState
          title="No leads found"
          description={
            search || statusFilter.length > 0 || priorityFilter.length > 0
              ? "Try adjusting your search or filters."
              : "Create your first lead to get started."
          }
          action={
            (isAdmin || isManager) ? (
              <Button size="sm" onClick={() => router.push("/crm/leads/new")}>
                <Plus className="mr-1.5 size-3.5" />
                New Lead
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm" role="grid">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Lead</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Company</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Priority</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Assigned To</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Value</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Follow-up</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((lead) => {
                  const statusCfg = LEAD_STATUS_CONFIG[lead.status];
                  const priorityCfg = LEAD_PRIORITY_CONFIG[lead.priority];
                  return (
                    <tr
                      key={lead.id}
                      className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/crm/leads/${lead.id}`)}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium">{lead.title}</div>
                        {lead.contact && (
                          <div className="text-xs text-muted-foreground">
                            {lead.contact.first_name} {lead.contact.last_name ?? ""}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {lead.company?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={`text-xs ${statusCfg.color}`}>
                          <span className={`mr-1.5 size-1.5 rounded-full ${statusCfg.bgColor}`} />
                          {statusCfg.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${priorityCfg.color}`}>
                          {priorityCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {lead.assigned_user?.full_name ?? lead.assigned_user?.email ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatCurrency(lead.estimated_value, lead.currency)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(lead.next_follow_up_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/crm/leads/${lead.id}`);
                          }}
                          aria-label={`View ${lead.title}`}
                        >
                          <Eye className="size-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-2 md:hidden">
            {data.data.map((lead) => {
              const statusCfg = LEAD_STATUS_CONFIG[lead.status];
              const priorityCfg = LEAD_PRIORITY_CONFIG[lead.priority];
              return (
                <Card
                  key={lead.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/crm/leads/${lead.id}`)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{lead.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {lead.company?.name ?? "No company"}
                          {lead.contact
                            ? ` · ${lead.contact.first_name} ${lead.contact.last_name ?? ""}`
                            : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge variant="outline" className={`text-[10px] ${statusCfg.color}`}>
                          {statusCfg.label}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span className={priorityCfg.color}>{priorityCfg.label} priority</span>
                      <span>{formatCurrency(lead.estimated_value, lead.currency)}</span>
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
