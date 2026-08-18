"use client";

import { AuthProvider } from "@/context/AuthContext";
import { AppShell } from "./AppShell";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppShell>{children}</AppShell>
    </AuthProvider>
  );
}
