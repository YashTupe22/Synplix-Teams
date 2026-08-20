import { Metadata } from "next";
import { requirePermission, Permission } from "@/lib/authorization-server";
import { getNotifications } from "@/services/notifications";
import { PageHeader } from "@/components/page-header";
import { NotificationList } from "@/components/notifications/notification-list";
import type { NotificationFilterType } from "@/types/notifications";

export const metadata: Metadata = {
  title: "Notifications | Synplix Teams",
};

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; page?: string }>;
}) {
  await requirePermission(Permission.DASHBOARD_VIEW);

  const params = await searchParams;
  const filter = (params.filter as NotificationFilterType) || "all";
  const page = parseInt(params.page || "1", 10);

  const result = await getNotifications({
    filter,
    page,
    limit: 20,
  }).catch(() => ({
    data: [],
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  }));

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Notifications"
        description="Stay updated with your team activity"
      />

      <NotificationList
        initialNotifications={result.data}
        initialTotal={result.total}
        initialPage={result.page}
        initialTotalPages={result.totalPages}
        filter={filter}
      />
    </div>
  );
}
