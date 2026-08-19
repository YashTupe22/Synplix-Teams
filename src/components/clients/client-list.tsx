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
import { CLIENT_STATUS_CONFIG, type ClientWithRelations, type PaginatedResult } from "@/types/clients";

interface ClientListProps {
  initialData: PaginatedResult<ClientWithRelations>;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ClientList({ initialData }: ClientListProps) {
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const fetchData = async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("page", String(page));

    const res = await fetch(`/api/clients?${params.toString()}`);
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
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9"
              aria-label="Search clients"
            />
          </div>
          <Button variant="outline" size="sm" onClick={handleSearch} disabled={isPending}>
            Search
          </Button>
        </div>
        <Link href="/clients/new" className={buttonVariants({ size: "sm" })}>
          <Plus className="mr-1.5 size-3.5" />
          New Client
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
          title="No clients found"
          description={search ? "Try adjusting your search." : "Convert a WON opportunity to create your first client."}
        />
      ) : (
        <>
          <div className="hidden md:block overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm" role="grid">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Client</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Company</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Primary Contact</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Account Manager</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Projects</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Created</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((client) => {
                  const statusCfg = CLIENT_STATUS_CONFIG[client.status];
                  return (
                    <tr key={client.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/clients/${client.id}`} className="font-medium hover:underline">
                          {client.client_code}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {client.company?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {client.primary_contact
                          ? `${client.primary_contact.first_name} ${client.primary_contact.last_name ?? ""}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {client.account_manager?.full_name ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={`text-xs ${statusCfg.color}`}>
                          {statusCfg.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {client.active_projects_count} active / {client.total_projects_count} total
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(client.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="space-y-2 md:hidden">
            {data.data.map((client) => {
              const statusCfg = CLIENT_STATUS_CONFIG[client.status];
              return (
                <Link key={client.id} href={`/clients/${client.id}`}>
                  <Card className="hover:bg-muted/50 transition-colors">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0">
                          <p className="font-medium">{client.client_code}</p>
                          <p className="text-xs text-muted-foreground">{client.company?.name ?? "—"}</p>
                        </div>
                        <Badge variant="outline" className={`shrink-0 text-[10px] ${statusCfg.color}`}>
                          {statusCfg.label}
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{client.account_manager?.full_name ?? "No manager"}</span>
                        <span>{client.active_projects_count} active projects</span>
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
