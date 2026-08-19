"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useNotifications } from "@/context/NotificationsContext";
import { timeAgo } from "@/lib/format";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications-store";

export function NotificationBell() {
  const { items, unread } = useNotifications();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const unreadItems = useMemo(() => items.filter((item) => !item.read), [items]);
  const recent = unreadItems.slice(0, 8);

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        className="relative inline-flex rounded-full p-2.5 text-ink hover:bg-paper"
        aria-label={unread ? `${unread} notifications` : "Notifications"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-semibold text-paper">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-[24px] bg-paper shadow-[0_16px_40px_rgba(20,17,14,0.12),0_0_0_1px_var(--color-line)]">
          <div className="flex items-center justify-between px-4 py-3">
            <p className="font-medium">Notifications</p>
            {unreadItems.length > 0 && (
              <button
                type="button"
                className="text-xs text-accent"
                onClick={() => void markAllNotificationsRead(unreadItems)}
              >
                Clear all
              </button>
            )}
          </div>
          <ul className="select-panel-scroll max-h-[min(24rem,70vh)] overflow-y-auto overscroll-contain">
            {recent.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="w-full bg-accent/10 px-4 py-3 text-left hover:bg-accent/15"
                  onClick={() => {
                    void markNotificationRead(item.id);
                    setOpen(false);
                    router.push(item.href || "/inbox");
                  }}
                >
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-sm text-muted">{item.body}</p>
                  <p className="mt-1 text-[11px] text-muted">{timeAgo(item.createdAt)}</p>
                </button>
              </li>
            ))}
          </ul>
          {!recent.length && (
            <p className="px-4 py-6 text-sm text-muted">No new notifications.</p>
          )}
          <Link
            href="/notifications"
            className="block border-t border-line px-4 py-3 text-center text-sm text-accent"
            onClick={() => setOpen(false)}
          >
            See all
          </Link>
        </div>
      )}
    </div>
  );
}
