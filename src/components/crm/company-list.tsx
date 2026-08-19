"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import type { Company, PaginatedResult } from "@/types/crm";

interface CompanyListProps {
  initialData: PaginatedResult<Company & { _count?: { contacts: number; leads: number } }>;
  isAdmin: boolean;
  isManager: boolean;
}

export function CompanyList({ initialData, isAdmin, isManager }: CompanyListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const fetchData = async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("page", String(page));
    const res = await fetch(`/api/crm/companies?${params.toString()}`);
    if (res.ok) setData(await res.json());
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
              placeholder="Search companies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="sm" onClick={handleSearch} disabled={isPending}>
            Search
          </Button>
        </div>
        {(isAdmin || isManager) && (
          <Button size="sm" onClick={() => router.push("/crm/companies/new")}>
            <Plus className="mr-1.5 size-3.5" />
            New Company
          </Button>
        )}
      </div>

      {data.data.length === 0 ? (
        <EmptyState
          title="No companies found"
          description={
            search
              ? "Try adjusting your search."
              : "Add your first company to get started."
          }
          action={
            (isAdmin || isManager) ? (
              <Button size="sm" onClick={() => router.push("/crm/companies/new")}>
                <Plus className="mr-1.5 size-3.5" />
                New Company
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.data.map((company) => (
              <Card
                key={company.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => router.push(`/crm/companies/${company.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{company.name}</p>
                      {company.industry && (
                        <p className="text-xs text-muted-foreground">{company.industry}</p>
                      )}
                    </div>
                    <Button variant="ghost" size="icon-sm" aria-label={`View ${company.name}`}>
                      <Eye className="size-3.5" />
                    </Button>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    {company.city && <span>{company.city}</span>}
                    {company.country && <span>{company.country}</span>}
                  </div>
                  {company.email && (
                    <p className="mt-1 text-xs text-muted-foreground truncate">{company.email}</p>
                  )}
                </CardContent>
              </Card>
            ))}
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
                  onClick={() => { setPage((p) => p - 1); startTransition(() => fetchData()); }}
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
                  onClick={() => { setPage((p) => p + 1); startTransition(() => fetchData()); }}
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
