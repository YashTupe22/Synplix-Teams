"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import type { Contact, Company, PaginatedResult } from "@/types/crm";

interface ContactListProps {
  initialData: PaginatedResult<Contact & { company: Pick<Company, "id" | "name"> | null }>;
  isAdmin: boolean;
  isManager: boolean;
}

export function ContactList({ initialData, isAdmin, isManager }: ContactListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const fetchData = async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("page", String(page));
    const res = await fetch(`/api/crm/contacts?${params.toString()}`);
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
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="sm" onClick={handleSearch} disabled={isPending}>Search</Button>
        </div>
        {(isAdmin || isManager) && (
          <Button size="sm" onClick={() => router.push("/crm/contacts/new")}>
            <Plus className="mr-1.5 size-3.5" />
            New Contact
          </Button>
        )}
      </div>

      {data.data.length === 0 ? (
        <EmptyState
          title="No contacts found"
          description={search ? "Try adjusting your search." : "Add your first contact to get started."}
          action={(isAdmin || isManager) ? (
            <Button size="sm" onClick={() => router.push("/crm/contacts/new")}>
              <Plus className="mr-1.5 size-3.5" /> New Contact
            </Button>
          ) : undefined}
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.data.map((contact) => (
              <Card
                key={contact.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => router.push(`/crm/contacts/${contact.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {contact.first_name} {contact.last_name ?? ""}
                      </p>
                      {contact.job_title && (
                        <p className="text-xs text-muted-foreground">{contact.job_title}</p>
                      )}
                    </div>
                    <Button variant="ghost" size="icon-sm" aria-label={`View contact`}>
                      <Eye className="size-3.5" />
                    </Button>
                  </div>
                  {contact.company && (
                    <p className="mt-2 text-xs text-muted-foreground">{contact.company.name}</p>
                  )}
                  <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                    {contact.email && <span className="truncate">{contact.email}</span>}
                    {contact.phone && <span>{contact.phone}</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                Showing {(page - 1) * data.limit + 1}–{Math.min(page * data.limit, data.total)} of {data.total}
              </p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon-sm" disabled={page === 1}
                  onClick={() => { setPage((p) => p - 1); startTransition(() => fetchData()); }}>
                  <ChevronLeft className="size-3.5" />
                </Button>
                <span className="px-2 text-xs text-muted-foreground">{page} / {data.totalPages}</span>
                <Button variant="outline" size="icon-sm" disabled={page >= data.totalPages}
                  onClick={() => { setPage((p) => p + 1); startTransition(() => fetchData()); }}>
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
