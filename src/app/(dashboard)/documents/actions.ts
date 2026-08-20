"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/authorization-server";
import { Permission } from "@/lib/authorization";
import {
  DocumentEntityType,
  DocumentInsert,
  isValidEntityType,
  isAllowedMimeType,
  isAllowedExtension,
  isBlockedExtension,
  MAX_FILE_SIZE,
  generateStoragePath,
} from "@/types/documents";
import { createDocument, updateDocument, deleteDocument } from "@/services/documents";

interface ActionState {
  error?: string;
  success?: boolean;
  id?: string;
}

export async function uploadDocumentAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const profile = await requirePermission(Permission.DOCUMENTS_MANAGE);

    const file = formData.get("file") as File | null;
    const entityType = formData.get("entity_type") as string;
    const entityId = formData.get("entity_id") as string;
    const description = (formData.get("description") as string) || null;

    if (!file) return { error: "No file selected" };
    if (!entityType || !isValidEntityType(entityType)) return { error: "Invalid entity type" };
    if (!entityId) return { error: "Entity ID is required" };

    if (file.size > MAX_FILE_SIZE) {
      return { error: `File size exceeds ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB limit` };
    }
    if (file.size === 0) return { error: "File is empty" };
    if (isBlockedExtension(file.name)) {
      return { error: "This file type is not allowed for security reasons" };
    }
    if (!isAllowedMimeType(file.type) && !isAllowedExtension(file.name)) {
      return { error: "File type not supported. Allowed: PDF, DOC, DOCX, XLS, XLSX, CSV, TXT, PNG, JPG, WEBP" };
    }

    const documentId = crypto.randomUUID();
    const storagePath = generateStoragePath(
      entityType as DocumentEntityType,
      entityId,
      documentId,
      file.name
    );

    const supabase = await createClient();
    const arrayBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from("synplix-documents")
      .upload(storagePath, arrayBuffer, {
        contentType: file.type || "application/octet-stream",
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return { error: "Failed to upload file to storage" };
    }

    const docInsert: DocumentInsert = {
      id: documentId,
      file_name: file.name,
      original_file_name: file.name,
      storage_path: storagePath,
      mime_type: file.type || "application/octet-stream",
      file_size: file.size,
      bucket_name: "synplix-documents",
      uploaded_by: profile.id,
      description,
      entity_type: entityType,
      entity_id: entityId,
    };

    const doc = await createDocument(docInsert);

    revalidatePath("/documents");
    revalidatePath(`/${entityType}s/${entityId}`);

    return { success: true, id: doc.id };
  } catch (error) {
    console.error("Upload action error:", error);
    return { error: "An unexpected error occurred" };
  }
}

export async function updateDocumentAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = formData.get("id") as string;
    const fileName = formData.get("file_name") as string;
    const description = formData.get("description") as string | null;

    if (!id) return { error: "Document ID is required" };

    const updates: { file_name?: string; description?: string | null } = {};
    if (fileName && fileName.trim()) updates.file_name = fileName.trim();
    if (description !== null) updates.description = description || null;

    await updateDocument(id, updates);

    revalidatePath("/documents");
    return { success: true };
  } catch (error) {
    console.error("Update action error:", error);
    return { error: "Failed to update document" };
  }
}

export async function deleteDocumentAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = formData.get("id") as string;
    if (!id) return { error: "Document ID is required" };

    await deleteDocument(id);

    revalidatePath("/documents");
    return { success: true };
  } catch (error) {
    console.error("Delete action error:", error);
    return { error: "Failed to delete document" };
  }
}

export async function getDocumentUrlAction(
  id: string
): Promise<{ url?: string; error?: string }> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { data: doc, error: fetchError } = await supabase
      .from("documents")
      .select("storage_path, bucket_name")
      .eq("id", id)
      .single();

    if (fetchError || !doc) return { error: "Document not found" };

    const { data, error } = await supabase.storage
      .from(doc.bucket_name)
      .createSignedUrl(doc.storage_path, 300);

    if (error) return { error: "Failed to generate download URL" };
    return { url: data.signedUrl };
  } catch (error) {
    return { error: "Failed to generate download URL" };
  }
}
