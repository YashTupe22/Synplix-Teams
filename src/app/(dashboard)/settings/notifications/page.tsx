import { Metadata } from "next";
import { requirePermission, Permission } from "@/lib/authorization-server";
import { getPreferences } from "@/services/notifications";
import { PageHeader } from "@/components/page-header";
import { NotificationPreferencesForm } from "@/components/notifications/notification-preferences-form";

export const metadata: Metadata = {
  title: "Notification Settings | Synplix Teams",
};

export default async function NotificationSettingsPage() {
  await requirePermission(Permission.DASHBOARD_VIEW);

  const preferences = await getPreferences();

  if (!preferences) {
    return (
      <div className="space-y-6 p-6">
        <PageHeader
          title="Notification Settings"
          description="Manage your notification preferences"
        />
        <div className="rounded-md bg-yellow-50 p-4 text-sm text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
          Unable to load notification preferences. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Notification Settings"
        description="Manage your notification preferences"
      />

      <NotificationPreferencesForm preferences={preferences} />
    </div>
  );
}
