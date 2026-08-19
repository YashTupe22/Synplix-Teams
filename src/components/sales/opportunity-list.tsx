"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Filter, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SALES_STAGE_CONFIG,
  OPEN_STAGES,
  type SalesStage,
  type OpportunityWithRelations,
  type PaginatedResult,
} from "@/types/sales";

interface OpportunityListProps {
  initialData: PaginatedResult<OpportunityWithRelations>;
  isAdmin: boolean;
  isManager: boolean;
}

export function OpportunityList({ initialData, isAdmin, isManager }: OpportunityListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<SalesStage[]>([]);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const fetchData = async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (stageFilter.length > 0) params.set("stage", stageFilter.join(","));
    params.set("page", String(page));

    const res = await fetch(`/api/sales/opportunities?${params.toString()}`);
    if (res.ok) {
      const result = await res.json();
      setData(result);
    }
  };

  const handleSearch = () => {
    setPage(1);
    startTransition(() => fetchData());
  };

  const toggleStage = (s: SalesStage) => {
    setStageFilter((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
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
              placeholder="Search opportunities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9"
              aria-label="Search opportunities"
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
            {stageFilter.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px]">
                {stageFilter.length}
              </Badge>
            )}
          </Button>
        </div>
        {(isAdmin || isManager) && (
          <Button size="sm" onClick={() => router.push("/sales/opportunities/new")}>
            <Plus className="mr-1.5 size-3.5" />
            New Opportunity
          </Button>
        )}
      </div>

      {/* Filter chips */}
      {showFilters && (
        <div className="rounded-lg border border-border p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Stage</p>
          <div className="flex flex-wrap gap-1.5">
            {OPEN_STAGES.map((s) => (
              <button
                key={s}
                onClick={() => toggleStage(s)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  stageFilter.includes(s)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {SALES_STAGE_CONFIG[s].label}
              </button>
            ))}
          </div>
          {stageFilter.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStageFilter([]);
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
          title="No opportunities found"
          description={
            search || stageFilter.length > 0
              ? "Try adjusting your search or filters."
              : "Create your first opportunity to get started."
          }
          action={
            (isAdmin || isManager) ? (
              <Button size="sm" onClick={() => router.push("/sales/opportunities/new")}>
                <Plus className="mr-1.5 size-3.5" />
                New Opportunity
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
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Lead</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Company</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Owner</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Value</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Stage</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Probability</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Expected Close</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((opp) => {
                  const stageCfg = SALES_STAGE_CONFIG[opp.stage];
                  return (
                    <tr
                      key={opp.id}
                      className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/sales/opportunities/${opp.id}`)}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium">{opp.title}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {opp.lead?.title ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {opp.lead_company?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {opp.owner?.full_name ?? opp.owner?.email ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatCurrency(opp.value, opp.currency)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={`text-xs ${stageCfg.color}`}>
                          <span className={`mr-1.5 size-1.5 rounded-full ${stageCfg.bgColor}`} />
                          {stageCfg.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {opp.probability}%
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(opp.expected_close_date)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/sales/opportunities/${opp.id}`);
                          }}
                          aria-label={`View ${opp.title}`}
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
            {data.data.map((opp) => {
              const stageCfg = SALES_STAGE_CONFIG[opp.stage];
              return (
                <Card
                  key={opp.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/sales/opportunities/${opp.id}`)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{opp.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {opp.lead_company?.name ?? opp.lead?.title ?? "No lead"}
                        </p>
                      </div>
                      <Badge variant="outline" className={`text-[10px] ${stageCfg.color}`}>
                        {stageCfg.label}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-medium">{formatCurrency(opp.value, opp.currency)}</span>
                      <span>{opp.probability}%</span>
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
