import { NextRequest, NextResponse } from "next/server";
import { getDocuments } from "@/services/documents";
import { DocumentEntityType, isValidEntityType } from "@/types/documents";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const filters = {
      search: searchParams.get("search") || undefined,
      entity_type: (searchParams.get("entity_type") as DocumentEntityType) || undefined,
      entity_id: searchParams.get("entity_id") || undefined,
      mime_type: searchParams.get("mime_type") || undefined,
      uploaded_by: searchParams.get("uploaded_by") || undefined,
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 25,
    };

    if (filters.entity_type && !isValidEntityType(filters.entity_type)) {
      return NextResponse.json({ error: "Invalid entity type" }, { status: 400 });
    }

    const result = await getDocuments(filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Documents API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
