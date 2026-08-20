"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { AccountPageTitle } from "@/components/AccountShell";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationsContext";
import { DeviceAlertsCard } from "@/components/DeviceAlertsCard";
import { PageSkeleton } from "@/components/PageSkeleton";
import { timeAgo } from "@/lib/format";
import {
  markAllNotificationsRead,
  markNotificationRead,
  purgeOldReadNotifications,
} from "@/lib/notifications-store";

export default function NotificationsPage() {
  const { user, loading } = useAuth();
  const { items, unread } = useNotifications();
  const router = useRouter();
  const purgedRef = useRef(false);
  const unreadItems = useMemo(() => items.filter((item) => !item.read), [items]);

  useEffect(() => {
    if (!user || !items.length || purgedRef.current) return;
    purgedRef.current = true;
    void purgeOldReadNotifications(items);
  }, [user, items]);

  if (loading) return <PageSkeleton />;

  if (!user) {
    return (
      <div className="py-16 text-center">
        <h1 className="font-display text-4xl">Notifications</h1>
        <p className="mt-2 text-sm text-muted">Sign in to see alerts about chats and ads.</p>
        <Link
          href="/login?next=/notifications"
          className="mt-5 inline-flex h-11 items-center rounded-full bg-ink px-5 text-paper"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
      <div className="mx-auto w-full max-w-lg shrink-0 px-4 lg:px-6">
        <AccountPageTitle
          title="Notifications"
          subtitle={
            <p className="text-sm text-muted">
              {unread ? `${unread} new` : "You are up to date."}
            </p>
          }
          actions={
            unreadItems.length > 0 ? (
              <button
                type="button"
                className="text-sm text-accent"
                onClick={() => void markAllNotificationsRead(unreadItems)}
              >
                Clear all
              </button>
            ) : null
          }
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-6">
        <div className="mx-auto max-w-lg space-y-6 px-4 lg:px-6">
          <DeviceAlertsCard />
          <ul className="space-y-2">
            {unreadItems.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="w-full rounded-[24px] bg-accent/10 px-4 py-4 text-left shadow-[0_0_0_1px_var(--color-line)] hover:bg-accent/15"
                  onClick={() => {
                    void markNotificationRead(item.id);
                    router.push(item.href || "/");
                  }}
                >
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{item.body}</p>
                  <p className="mt-2 text-xs text-muted">{timeAgo(item.createdAt)}</p>
                </button>
              </li>
            ))}
          </ul>
          {!unreadItems.length && (
            <p className="text-sm text-muted">No new notifications.</p>
          )}
        </div>
      </div>
    </div>
  );
}
