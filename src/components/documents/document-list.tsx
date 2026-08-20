"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Image,
  Table,
  File,
  Download,
  Eye,
  Trash2,
} from "lucide-react";
import { formatFileSize, canPreviewInBrowser, getFileTypeConfig, DocumentWithRelations } from "@/types/documents";
import { deleteDocumentAction, getDocumentUrlAction } from "@/app/(dashboard)/documents/actions";
import { formatDistanceToNow } from "date-fns";

interface DocumentListProps {
  documents: DocumentWithRelations[];
  onDelete?: () => void;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return <Image className="h-4 w-4" />;
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType === "text/csv"
  )
    return <Table className="h-4 w-4" />;
  if (
    mimeType.includes("pdf") ||
    mimeType.includes("word") ||
    mimeType.includes("document")
  )
    return <FileText className="h-4 w-4" />;
  return <File className="h-4 w-4" />;
}

export function DocumentList({ documents, onDelete }: DocumentListProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>("");
  const [, deleteFormAction] = useFormState(
    deleteDocumentAction,
    {}
  );

  const handleDownload = async (doc: DocumentWithRelations) => {
    setDownloadingId(doc.id);
    try {
      const result = await getDocumentUrlAction(doc.id);
      if (result.url) {
        const a = window.document.createElement("a");
        a.href = result.url;
        a.download = doc.original_file_name;
        window.document.body.appendChild(a);
        a.click();
        window.document.body.removeChild(a);
      }
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePreview = async (doc: DocumentWithRelations) => {
    if (!canPreviewInBrowser(doc.mime_type)) {
      handleDownload(doc);
      return;
    }
    const result = await getDocumentUrlAction(doc.id);
    if (result.url) {
      setPreviewUrl(result.url);
      setPreviewName(doc.original_file_name);
    }
  };

  if (documents.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No documents uploaded yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {documents.map((doc) => {
          const config = getFileTypeConfig(doc.mime_type);
          return (
            <div
              key={doc.id}
              className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
            >
              <div className={`shrink-0 ${config.color}`}>
                {getFileIcon(doc.mime_type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {doc.file_name}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatFileSize(doc.file_size)}</span>
                  <span>&middot;</span>
                  <span>{config.label}</span>
                  {doc.uploader && (
                    <>
                      <span>&middot;</span>
                      <span>
                        {doc.uploader.full_name || doc.uploader.email}
                      </span>
                    </>
                  )}
                  <span>&middot;</span>
                  <span>
                    {formatDistanceToNow(new Date(doc.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                {doc.description && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {doc.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePreview(doc)}
                  disabled={downloadingId === doc.id}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(doc)}
                  disabled={downloadingId === doc.id}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <form action={deleteFormAction}>
                  <input type="hidden" name="id" value={doc.id} />
                  <Button variant="ghost" size="sm" type="submit">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </form>
              </div>
            </div>
          );
        })}
      </div>

      {/* Preview Modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <div
            className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <p className="text-sm font-medium truncate">{previewName}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const a = window.document.createElement("a");
                    a.href = previewUrl;
                    a.download = previewName;
                    window.document.body.appendChild(a);
                    a.click();
                    window.document.body.removeChild(a);
                  }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewUrl(null)}
                >
                  Close
                </Button>
              </div>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(90vh-64px)]">
              {previewName.endsWith(".pdf") ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-[80vh] rounded border"
                  title={previewName}
                />
              ) : previewName.match(/\.(png|jpg|jpeg|webp)$/i) ? (
                <img
                  src={previewUrl}
                  alt={previewName}
                  className="max-w-full h-auto mx-auto rounded"
                />
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  Preview not available for this file type
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
