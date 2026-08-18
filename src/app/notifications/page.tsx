"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationsContext";
import { DeviceAlertsCard } from "@/components/DeviceAlertsCard";
import { PageSkeleton } from "@/components/PageSkeleton";
import { timeAgo } from "@/lib/format";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications-store";

export default function NotificationsPage() {
  const { user, loading } = useAuth();
  const { items, unread } = useNotifications();
  const router = useRouter();

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
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl tracking-tight">Notifications</h1>
          <p className="mt-2 text-sm text-muted">
            {unread ? `${unread} new` : "You are up to date."}
          </p>
        </div>
        {unread > 0 && (
          <button
            type="button"
            className="text-sm text-accent"
            onClick={() => void markAllNotificationsRead(items)}
          >
            Mark all read
          </button>
        )}
      </div>

      <DeviceAlertsCard />

      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className={`w-full rounded-[24px] px-4 py-4 text-left shadow-[0_0_0_1px_var(--color-line)] ${
                item.read ? "bg-paper" : "bg-accent/10"
              }`}
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
      {!items.length && (
        <p className="text-sm text-muted">No notifications yet.</p>
      )}
    </div>
  );
}
