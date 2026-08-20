"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { markNotificationReadAction } from "@/app/(dashboard)/notifications/actions";
import {
  getNotificationUrl,
  formatRelativeTime,
  NOTIFICATION_TYPE_CONFIG,
  type NotificationWithRelations,
} from "@/types/notifications";

interface NotificationBellProps {
  initialCount: number;
  initialNotifications: NotificationWithRelations[];
}

export function NotificationBell({
  initialCount,
  initialNotifications,
}: NotificationBellProps) {
  const router = useRouter();
  const [count, setCount] = React.useState(initialCount);
  const [notifications, setNotifications] = React.useState(initialNotifications);
  const [open, setOpen] = React.useState(false);

  const displayCount = count > 99 ? "99+" : String(count);

  const handleNotificationClick = async (notification: NotificationWithRelations) => {
    if (!notification.is_read) {
      const result = await markNotificationReadAction(notification.id);
      if (result.success) {
        setCount((prev) => Math.max(0, prev - 1));
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id
              ? { ...n, is_read: true, read_at: new Date().toISOString() }
              : n
          )
        );
      }
    }
    setOpen(false);
    const url = getNotificationUrl(notification);
    if (url) {
      router.push(url);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Notifications${count > 0 ? ` (${displayCount} unread)` : ""}`}
            className="relative"
          />
        }
      >
        <Bell className="size-4" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
            {displayCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-sm font-medium">Notifications</span>
          <Link
            href="/notifications"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setOpen(false)}
          >
            View all
          </Link>
        </div>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="px-2 py-6 text-center">
            <Bell className="mx-auto mb-2 size-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No notifications</p>
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {notifications.map((notification) => {
              const config = NOTIFICATION_TYPE_CONFIG[notification.type];
              return (
                <DropdownMenuItem
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`flex items-start gap-2 px-2 py-2 ${
                    !notification.is_read ? "bg-muted/30" : ""
                  }`}
                >
                  <div className="mt-1 flex shrink-0 items-center">
                    {!notification.is_read ? (
                      <span className="size-1.5 rounded-full bg-primary" />
                    ) : (
                      <span className="size-1.5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm ${
                        !notification.is_read ? "font-semibold" : ""
                      }`}
                    >
                      {notification.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                      {notification.message}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      {config && (
                        <span className="text-[10px] text-muted-foreground">
                          {config.label}
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {formatRelativeTime(notification.created_at)}
                      </span>
                    </div>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </div>
        )}
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5">
          <Link
            href="/settings/notifications"
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setOpen(false)}
          >
            <Settings className="size-3" />
            Notification settings
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
