"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";
import {
  DocumentEntityType,
  DocumentWithRelations,
} from "@/types/documents";
import { DocumentUploader } from "./document-uploader";
import { DocumentList } from "./document-list";

interface DocumentSectionProps {
  entityType: DocumentEntityType;
  entityId: string;
  initialDocuments?: DocumentWithRelations[];
}

export function DocumentSection({
  entityType,
  entityId,
  initialDocuments = [],
}: DocumentSectionProps) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [showUploader, setShowUploader] = useState(false);

  const fetchDocuments = useCallback(async () => {
    try {
      const controller = new AbortController();
      const response = await fetch(
        `/api/documents?entity_type=${entityType}&entity_id=${entityId}`,
        { signal: controller.signal }
      );
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.data || []);
      }
      return () => controller.abort();
    } catch {
      // Silently fail - use initial documents
    }
  }, [entityType, entityId]);

  useEffect(() => {
    if (initialDocuments.length === 0) {
      fetchDocuments();
    }
  }, [entityType, entityId, initialDocuments.length, fetchDocuments]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Documents
          {documents.length > 0 && (
            <span className="text-xs text-muted-foreground">
              ({documents.length})
            </span>
          )}
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowUploader(!showUploader)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Upload
        </Button>
      </CardHeader>
      <CardContent>
        {showUploader && (
          <div className="mb-4">
            <DocumentUploader
              entityType={entityType}
              entityId={entityId}
              onSuccess={() => {
                setShowUploader(false);
                fetchDocuments();
              }}
            />
          </div>
        )}
        <DocumentList
          documents={documents}
          onDelete={fetchDocuments}
        />
      </CardContent>
    </Card>
  );
}
