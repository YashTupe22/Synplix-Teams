"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCheck, Bell, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "@/app/(dashboard)/notifications/actions";
import {
  getNotificationUrl,
  formatRelativeTime,
  NOTIFICATION_FILTER_OPTIONS,
  NOTIFICATION_TYPE_CONFIG,
  type NotificationWithRelations,
  type NotificationFilterType,
} from "@/types/notifications";

interface NotificationListProps {
  initialNotifications: NotificationWithRelations[];
  initialTotal: number;
  initialPage: number;
  initialTotalPages: number;
  filter: NotificationFilterType;
}

export function NotificationList({
  initialNotifications,
  initialTotal,
  initialPage,
  initialTotalPages,
  filter,
}: NotificationListProps) {
  const router = useRouter();
  const [notifications, setNotifications] = React.useState(initialNotifications);
  const [page, setPage] = React.useState(initialPage);
  const [totalPages, setTotalPages] = React.useState(initialTotalPages);
  const [total, setTotal] = React.useState(initialTotal);

  // Sync props when filter changes
  React.useEffect(() => {
    setNotifications(initialNotifications);
    setPage(initialPage);
    setTotalPages(initialTotalPages);
    setTotal(initialTotal);
  }, [initialNotifications, initialPage, initialTotalPages, initialTotal]);

  const handleMarkRead = async (id: string) => {
    const result = await markNotificationReadAction(id);
    if (result.success) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        )
      );
    }
  };

  const handleMarkAllRead = async () => {
    const result = await markAllNotificationsReadAction();
    if (result.success) {
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          is_read: true,
          read_at: n.read_at || new Date().toISOString(),
        }))
      );
    }
  };

  const handleFilterChange = (newFilter: NotificationFilterType) => {
    const params = new URLSearchParams();
    if (newFilter !== "all") params.set("filter", newFilter);
    router.push(`/notifications${params.toString() ? "?" + params.toString() : ""}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams();
    if (filter !== "all") params.set("filter", filter);
    params.set("page", String(newPage));
    router.push(`/notifications?${params.toString()}`);
  };

  const handleNotificationClick = async (notification: NotificationWithRelations) => {
    if (!notification.is_read) {
      await handleMarkRead(notification.id);
    }
    const url = getNotificationUrl(notification);
    if (url) {
      router.push(url);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter tabs and mark all read */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1">
          {NOTIFICATION_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleFilterChange(opt.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleMarkAllRead}
          className="shrink-0"
        >
          <CheckCheck className="mr-2 size-4" />
          Mark all read
        </Button>
      </div>

      {/* Notification list */}
      {notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="mb-3 size-10 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">
              No notifications
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              You&apos;re all caught up!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-1">
          {notifications.map((notification) => {
            const config = NOTIFICATION_TYPE_CONFIG[notification.type];
            return (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`flex w-full items-start gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted/50 ${
                  !notification.is_read ? "bg-muted/30" : ""
                }`}
              >
                {/* Unread indicator */}
                <div className="mt-1 flex shrink-0 items-center justify-center">
                  {!notification.is_read ? (
                    <span className="size-2 rounded-full bg-primary" />
                  ) : (
                    <span className="size-2" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`text-sm ${
                        !notification.is_read
                          ? "font-semibold text-foreground"
                          : "font-medium text-foreground/80"
                      }`}
                    >
                      {notification.title}
                    </p>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatRelativeTime(notification.created_at)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                    {notification.message}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    {config && (
                      <Badge variant="secondary" className="text-[10px]">
                        {config.label}
                      </Badge>
                    )}
                    {notification.actor && (
                      <span className="text-xs text-muted-foreground">
                        by {notification.actor.full_name || notification.actor.email}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} ({total} notifications)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
