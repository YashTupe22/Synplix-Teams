import { createClient, createServiceClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/authorization-server";
import { Permission } from "@/lib/authorization";
import {
  Document,
  DocumentInsert,
  DocumentUpdate,
  DocumentWithRelations,
  DocumentFilters,
  DocumentEntityType,
  isValidEntityType,
} from "@/types/documents";
import { PaginatedResult } from "@/types/clients";

// ──────────────────────────────────────────────
// List documents with pagination and filters
// ──────────────────────────────────────────────

export async function getDocuments(
  filters: DocumentFilters = {}
): Promise<PaginatedResult<DocumentWithRelations>> {
  await requirePermission(Permission.DOCUMENTS_VIEW);

  const supabase = await createClient();
  const page = filters.page || 1;
  const limit = filters.limit || 25;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("documents")
    .select(
      `
      *,
      uploader:profiles!documents_uploaded_by_fkey(id, full_name, email)
    `,
      { count: "exact" }
    );

  if (filters.search) {
    query = query.or(`file_name.ilike.%${filters.search}%,original_file_name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  if (filters.entity_type) {
    query = query.eq("entity_type", filters.entity_type);
  }

  if (filters.entity_id) {
    query = query.eq("entity_id", filters.entity_id);
  }

  if (filters.mime_type) {
    query = query.eq("mime_type", filters.mime_type);
  }

  if (filters.uploaded_by) {
    query = query.eq("uploaded_by", filters.uploaded_by);
  }

  query = query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    data: (data ?? []) as DocumentWithRelations[],
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  };
}

// ──────────────────────────────────────────────
// Get documents for a specific entity
// ──────────────────────────────────────────────

export async function getDocumentsByEntity(
  entityType: DocumentEntityType,
  entityId: string
): Promise<DocumentWithRelations[]> {
  await requirePermission(Permission.DOCUMENTS_VIEW);

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("documents")
    .select(
      `
      *,
      uploader:profiles!documents_uploaded_by_fkey(id, full_name, email)
    `
    )
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as DocumentWithRelations[];
}

// ──────────────────────────────────────────────
// Get single document by ID
// ──────────────────────────────────────────────

export async function getDocumentById(
  id: string
): Promise<DocumentWithRelations | null> {
  await requirePermission(Permission.DOCUMENTS_VIEW);

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("documents")
    .select(
      `
      *,
      uploader:profiles!documents_uploaded_by_fkey(id, full_name, email)
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data as DocumentWithRelations;
}

// ──────────────────────────────────────────────
// Create document metadata
// ──────────────────────────────────────────────

export async function createDocument(
  doc: DocumentInsert
): Promise<Document> {
  await requirePermission(Permission.DOCUMENTS_MANAGE);

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("documents")
    .insert(doc)
    .select()
    .single();

  if (error) throw error;
  return data as Document;
}

// ──────────────────────────────────────────────
// Update document metadata (name, description)
// ──────────────────────────────────────────────

export async function updateDocument(
  id: string,
  updates: DocumentUpdate
): Promise<Document> {
  await requirePermission(Permission.DOCUMENTS_MANAGE);

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("documents")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Document;
}

// ──────────────────────────────────────────────
// Delete document
// ──────────────────────────────────────────────

export async function deleteDocument(id: string): Promise<void> {
  await requirePermission(Permission.DOCUMENTS_MANAGE);

  const supabase = await createClient();

  // Get document first for storage cleanup
  const { data: doc, error: fetchError } = await supabase
    .from("documents")
    .select("storage_path, bucket_name")
    .eq("id", id)
    .single();

  if (fetchError) throw fetchError;
  if (!doc) throw new Error("Document not found");

  // Delete from storage first
  const serviceClient = createServiceClient();
  const { error: storageError } = await serviceClient.storage
    .from(doc.bucket_name)
    .remove([doc.storage_path]);

  if (storageError) {
    console.error("Storage deletion failed:", storageError);
    throw new Error(
      `Failed to delete file from storage: ${storageError.message || "Unknown error"}`
    );
  }

  // Delete metadata from DB
  const { error: deleteError } = await supabase
    .from("documents")
    .delete()
    .eq("id", id);

  if (deleteError) throw deleteError;
}

// ──────────────────────────────────────────────
// Generate signed URL for download/preview
// ──────────────────────────────────────────────

export async function getDocumentSignedUrl(
  id: string,
  expiresIn = 300
): Promise<string> {
  await requirePermission(Permission.DOCUMENTS_VIEW);

  const supabase = await createClient();

  const { data: doc, error: fetchError } = await supabase
    .from("documents")
    .select("storage_path, bucket_name")
    .eq("id", id)
    .single();

  if (fetchError) throw fetchError;
  if (!doc) throw new Error("Document not found");

  const { data, error } = await supabase.storage
    .from(doc.bucket_name)
    .createSignedUrl(doc.storage_path, expiresIn);

  if (error) throw error;
  return data.signedUrl;
}

// ──────────────────────────────────────────────
// Get document count by entity
// ──────────────────────────────────────────────

export async function getDocumentCountByEntity(
  entityType: DocumentEntityType,
  entityId: string
): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("entity_type", entityType)
    .eq("entity_id", entityId);

  if (error) throw error;
  return count ?? 0;
}

// ──────────────────────────────────────────────
// Get document counts for multiple entities
// ──────────────────────────────────────────────

export async function getDocumentCountsByEntityType(
  entityType: DocumentEntityType,
  entityIds: string[]
): Promise<Record<string, number>> {
  if (entityIds.length === 0) return {};

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("documents")
    .select("entity_id")
    .eq("entity_type", entityType)
    .in("entity_id", entityIds);

  if (error) throw error;

  const counts: Record<string, number> = {};
  for (const id of entityIds) {
    counts[id] = 0;
  }
  for (const row of data ?? []) {
    counts[row.entity_id] = (counts[row.entity_id] || 0) + 1;
  }
  return counts;
}
