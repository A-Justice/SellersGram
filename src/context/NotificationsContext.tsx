"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";
import type { AppNotification } from "@/data/types";
import { subscribeNotifications } from "@/lib/notifications-store";
import { registerServiceWorker } from "@/lib/push-client";

type NotificationsValue = {
  items: AppNotification[];
  unread: number;
};

const NotificationsContext = createContext<NotificationsValue>({
  items: [],
  unread: 0,
});

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);

  useEffect(() => {
    void registerServiceWorker();
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "navigate" && typeof event.data.href === "string") {
        window.location.href = event.data.href;
      }
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }
    return subscribeNotifications(user.uid, setItems);
  }, [user]);

  const value = useMemo(
    () => ({
      items,
      unread: items.filter((item) => !item.read).length,
    }),
    [items],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
