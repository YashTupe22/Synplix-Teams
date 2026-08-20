"use client";

import { useState, useRef, useCallback } from "react";
import { useFormStatus } from "react-dom";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, FileText, AlertCircle } from "lucide-react";
import { uploadDocumentAction } from "@/app/(dashboard)/documents/actions";
import {
  DocumentEntityType,
  formatFileSize,
  MAX_FILE_SIZE,
  isBlockedExtension,
  isAllowedMimeType,
  isAllowedExtension,
} from "@/types/documents";

interface DocumentUploaderProps {
  entityType: DocumentEntityType;
  entityId: string;
  onSuccess?: () => void;
}

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled} className="w-full">
      {pending ? (
        <>
          <Upload className="mr-2 h-4 w-4 animate-spin" />
          Uploading...
        </>
      ) : (
        <>
          <Upload className="mr-2 h-4 w-4" />
          Upload File
        </>
      )}
    </Button>
  );
}

export function DocumentUploader({
  entityType,
  entityId,
  onSuccess,
}: DocumentUploaderProps) {
  const [state, formAction] = useActionState(uploadDocumentAction, {});
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB limit`;
    }
    if (file.size === 0) return "File is empty";
    if (isBlockedExtension(file.name)) {
      return "This file type is not allowed for security reasons";
    }
    if (!isAllowedMimeType(file.type) && !isAllowedExtension(file.name)) {
      return "File type not supported";
    }
    return null;
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      const error = validateFile(file);
      setValidationError(error);
      if (!error) {
        setSelectedFile(file);
      }
    },
    [validateFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const clearFile = useCallback(() => {
    setSelectedFile(null);
    setValidationError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleSubmit = useCallback(
    async (formData: FormData) => {
      if (selectedFile) {
        formData.set("file", selectedFile);
        formData.set("entity_type", entityType);
        formData.set("entity_id", entityId);
      }
      formAction(formData);
    },
    [selectedFile, entityType, entityId, formAction]
  );

  if (state.success) {
    clearFile();
    onSuccess?.();
  }

  return (
    <Card>
      <CardContent className="p-4">
        <form ref={formRef} action={handleSubmit} className="space-y-4">
          <input type="hidden" name="entity_type" value={entityType} />
          <input type="hidden" name="entity_id" value={entityId} />

          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors ${
              dragActive
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-muted/50"
            }`}
          >
            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground text-center">
              Drag & drop a file here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Max {Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB - PDF, DOC, DOCX, XLS, XLSX, CSV, TXT, PNG, JPG, WEBP
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            name="file"
            className="hidden"
            onChange={handleFileInput}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg,.webp"
          />

          {/* Selected File */}
          {selectedFile && (
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <FileText className="h-5 w-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearFile}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Description */}
          <div>
            <input
              type="text"
              name="description"
              placeholder="Description (optional)"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              maxLength={2000}
            />
          </div>

          {/* Errors */}
          {(state.error || validationError) && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {validationError || state.error}
            </div>
          )}

          {/* Submit */}
          <SubmitButton disabled={!selectedFile} />
        </form>
      </CardContent>
    </Card>
  );
}
