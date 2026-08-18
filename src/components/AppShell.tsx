"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "./BottomNav";
import { Header } from "./Header";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const admin = pathname.startsWith("/admin");

  if (admin) return <>{children}</>;

  return (
    <div className="flex min-h-full flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 lg:px-6 lg:pb-16">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
