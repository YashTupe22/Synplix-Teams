import { Metadata } from "next";
import { requirePermission } from "@/lib/authorization-server";
import { Permission } from "@/lib/authorization";
import { getDocuments } from "@/services/documents";
import { PageHeader } from "@/components/page-header";
import { DocumentBrowser } from "@/components/documents/document-browser";
import { DocumentEntityType } from "@/types/documents";

export const metadata: Metadata = {
  title: "Documents | Synplix Infotech",
  description: "Manage and browse all documents",
};

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const profile = await requirePermission(Permission.DOCUMENTS_VIEW);
  const params = await searchParams;

  const filters = {
    search: params.search,
    entity_type: params.entity_type as DocumentEntityType | undefined,
    page: params.page ? parseInt(params.page) : 1,
    limit: 25,
  };

  const result = await getDocuments(filters);

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Documents"
        description="Browse and manage all uploaded documents"
      />
      <DocumentBrowser
        initialResult={result}
        initialFilters={{
          search: params.search,
          entity_type: params.entity_type as DocumentEntityType | undefined,
          page: params.page ? parseInt(params.page) : 1,
        }}
      />
    </div>
  );
}
