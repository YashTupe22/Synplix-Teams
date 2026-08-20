"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import {
  DocumentWithRelations,
  DocumentEntityType,
  DOCUMENT_ENTITY_TYPES,
  DOCUMENT_ENTITY_TYPE_LABELS,
} from "@/types/documents";
import { PaginatedResult } from "@/types/clients";
import { DocumentList } from "./document-list";

interface DocumentBrowserProps {
  initialResult: PaginatedResult<DocumentWithRelations>;
  initialFilters: {
    search?: string;
    entity_type?: DocumentEntityType;
    page?: number;
  };
}

export function DocumentBrowser({
  initialResult,
  initialFilters,
}: DocumentBrowserProps) {
  const [result, setResult] = useState(initialResult);
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState(initialFilters.search || "");
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const fetchDocuments = useCallback(async (newFilters: typeof filters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (newFilters.search) params.set("search", newFilters.search);
      if (newFilters.entity_type) params.set("entity_type", newFilters.entity_type);
      if (newFilters.page) params.set("page", String(newFilters.page));

      const response = await fetch(`/api/documents?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setResult(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback((value: string) => {
    setSearchInput(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      const newFilters = { ...filters, search: value || undefined, page: 1 };
      setFilters(newFilters);
      fetchDocuments(newFilters);
    }, 300);
  }, [filters, fetchDocuments]);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const handleEntityFilter = (entityType: DocumentEntityType | undefined) => {
    const newFilters = { ...filters, entity_type: entityType, page: 1 };
    setFilters(newFilters);
    fetchDocuments(newFilters);
  };

  const handlePage = (page: number) => {
    const newFilters = { ...filters, page };
    setFilters(newFilters);
    fetchDocuments(newFilters);
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchInput}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={!filters.entity_type ? "default" : "outline"}
            size="sm"
            onClick={() => handleEntityFilter(undefined)}
          >
            All
          </Button>
          {DOCUMENT_ENTITY_TYPES.map((type) => (
            <Button
              key={type}
              variant={filters.entity_type === type ? "default" : "outline"}
              size="sm"
              onClick={() => handleEntityFilter(type)}
            >
              {DOCUMENT_ENTITY_TYPE_LABELS[type]}
            </Button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className={loading ? "opacity-50 pointer-events-none" : ""}>
        <DocumentList documents={result.data} onDelete={() => fetchDocuments(filters)} />
      </div>

      {/* Pagination */}
      {result.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(result.page - 1) * result.limit + 1}-
            {Math.min(result.page * result.limit, result.total)} of {result.total}{" "}
            documents
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePage(result.page - 1)}
              disabled={result.page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {result.page} of {result.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePage(result.page + 1)}
              disabled={result.page >= result.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
