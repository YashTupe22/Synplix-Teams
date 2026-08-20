import { getUnreadCount, getUnreadNotifications } from "@/services/notifications";
import { NotificationBell } from "@/components/notifications/notification-bell";

export async function NotificationBellWrapper() {
  const [count, notifications] = await Promise.all([
    getUnreadCount().catch(() => 0),
    getUnreadNotifications().catch(() => []),
  ]);

  return (
    <NotificationBell
      initialCount={count}
      initialNotifications={notifications}
    />
  );
}
