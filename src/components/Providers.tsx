"use client";

import { AuthProvider } from "@/context/AuthContext";
import { NotificationsProvider } from "@/context/NotificationsContext";
import { AppShell } from "./AppShell";
import { BoostPromoPrompt } from "./BoostPromoPrompt";
import { InstallPrompt } from "./InstallPrompt";
import { PushPrompt } from "./PushPrompt";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <NotificationsProvider>
        <AppShell>{children}</AppShell>
        <InstallPrompt />
        <PushPrompt />
        <BoostPromoPrompt />
      </NotificationsProvider>
    </AuthProvider>
  );
}
