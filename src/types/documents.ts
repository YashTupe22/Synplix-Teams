import type { Profile } from "@/types/database";
import { PaginatedResult } from "@/types/clients";

// ──────────────────────────────────────────────
// Entity Types
// ──────────────────────────────────────────────

export const DOCUMENT_ENTITY_TYPES = [
  "lead",
  "company",
  "contact",
  "opportunity",
  "client",
  "project",
  "task",
  "quotation",
  "invoice",
  "expense",
] as const;

export type DocumentEntityType = (typeof DOCUMENT_ENTITY_TYPES)[number];

export const DOCUMENT_ENTITY_TYPE_LABELS: Record<DocumentEntityType, string> = {
  lead: "Lead",
  company: "Company",
  contact: "Contact",
  opportunity: "Opportunity",
  client: "Client",
  project: "Project",
  task: "Task",
  quotation: "Quotation",
  invoice: "Invoice",
  expense: "Expense",
};

export const DOCUMENT_ENTITY_TYPE_ROUTES: Record<DocumentEntityType, string> = {
  lead: "/crm/leads",
  company: "/crm/companies",
  contact: "/crm/contacts",
  opportunity: "/sales/opportunities",
  client: "/clients",
  project: "/projects",
  task: "/tasks",
  quotation: "/finance/quotations",
  invoice: "/finance/invoices",
  expense: "/finance/expenses",
};

// ──────────────────────────────────────────────
// Allowed File Types
// ──────────────────────────────────────────────

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "text/plain",
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export const ALLOWED_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".csv",
  ".txt",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
] as const;

export const BLOCKED_EXTENSIONS = [
  ".exe",
  ".bat",
  ".cmd",
  ".sh",
  ".ps1",
  ".msi",
  ".dll",
  ".scr",
  ".com",
  ".vbs",
  ".js",
  ".html",
  ".htm",
  ".svg",
] as const;

export const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export const FILE_TYPE_CONFIG: Record<
  string,
  { label: string; icon: string; color: string }
> = {
  "application/pdf": { label: "PDF", icon: "FileText", color: "text-red-500" },
  "application/msword": {
    label: "DOC",
    icon: "FileText",
    color: "text-blue-500",
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    label: "DOCX",
    icon: "FileText",
    color: "text-blue-500",
  },
  "application/vnd.ms-excel": {
    label: "XLS",
    icon: "Table",
    color: "text-green-500",
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
    label: "XLSX",
    icon: "Table",
    color: "text-green-500",
  },
  "text/csv": { label: "CSV", icon: "Table", color: "text-green-500" },
  "text/plain": {
    label: "TXT",
    icon: "FileText",
    color: "text-muted-foreground",
  },
  "image/png": {
    label: "PNG",
    icon: "Image",
    color: "text-purple-500",
  },
  "image/jpeg": {
    label: "JPEG",
    icon: "Image",
    color: "text-purple-500",
  },
  "image/webp": {
    label: "WEBP",
    icon: "Image",
    color: "text-purple-500",
  },
};

// ──────────────────────────────────────────────
// Document Types
// ──────────────────────────────────────────────

export interface Document {
  id: string;
  file_name: string;
  original_file_name: string;
  storage_path: string;
  mime_type: string;
  file_size: number;
  bucket_name: string;
  uploaded_by: string;
  description: string | null;
  entity_type: string;
  entity_id: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentInsert {
  id?: string;
  file_name: string;
  original_file_name: string;
  storage_path: string;
  mime_type: string;
  file_size: number;
  bucket_name?: string;
  uploaded_by: string;
  description?: string | null;
  entity_type: string;
  entity_id: string;
}

export interface DocumentUpdate {
  file_name?: string;
  description?: string | null;
}

export interface DocumentWithRelations extends Document {
  uploader?: Pick<Profile, "id" | "full_name" | "email">;
}

// ──────────────────────────────────────────────
// Filters
// ──────────────────────────────────────────────

export interface DocumentFilters {
  search?: string;
  entity_type?: DocumentEntityType;
  entity_id?: string;
  mime_type?: string;
  uploaded_by?: string;
  page?: number;
  limit?: number;
}

// ──────────────────────────────────────────────
// Validation
// ──────────────────────────────────────────────

export function isValidEntityType(type: string): type is DocumentEntityType {
  return DOCUMENT_ENTITY_TYPES.includes(type as DocumentEntityType);
}

export function isAllowedMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType as (typeof ALLOWED_MIME_TYPES)[number]);
}

export function isAllowedExtension(filename: string): boolean {
  const ext = "." + filename.split(".").pop()?.toLowerCase();
  return ALLOWED_EXTENSIONS.includes(ext as (typeof ALLOWED_EXTENSIONS)[number]);
}

export function isBlockedExtension(filename: string): boolean {
  const ext = "." + filename.split(".").pop()?.toLowerCase();
  return BLOCKED_EXTENSIONS.includes(ext as (typeof BLOCKED_EXTENSIONS)[number]);
}

export function getFileTypeConfig(mimeType: string) {
  return (
    FILE_TYPE_CONFIG[mimeType] || {
      label: "File",
      icon: "File",
      color: "text-muted-foreground",
    }
  );
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function sanitizeFileName(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^_+|_+$/g, "")
    .substring(0, 255);
}

export function generateStoragePath(
  entityType: DocumentEntityType,
  entityId: string,
  documentId: string,
  originalFilename: string
): string {
  const safe = sanitizeFileName(originalFilename);
  return `${entityType}s/${entityId}/${documentId}/${safe}`;
}

export function canPreviewInBrowser(mimeType: string): boolean {
  return ["application/pdf", "image/png", "image/jpeg", "image/webp", "text/plain"].includes(
    mimeType
  );
}
