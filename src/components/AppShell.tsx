"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "./BottomNav";
import { Header } from "./Header";
import { HomeSearchProvider } from "@/context/HomeSearchContext";

function isAccountArea(pathname: string) {
  return (
    pathname === "/account" ||
    pathname.startsWith("/my-ads") ||
    pathname.startsWith("/inbox") ||
    pathname.startsWith("/notifications")
  );
}

function isFixedShell(pathname: string) {
  return isAccountArea(pathname) || pathname.startsWith("/sell");
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const admin = pathname.startsWith("/admin");
  const fixedShell = isFixedShell(pathname);
  const isHome = pathname === "/";
  const isSearch = pathname.startsWith("/search");

  if (admin) return <>{children}</>;

  if (fixedShell) {
    return (
      <HomeSearchProvider enabled={false}>
        <div className="flex h-dvh flex-col overflow-hidden bg-canvas">
          <Header />
          <div className="min-h-0 flex-1 overflow-hidden pb-[calc(max(4.5rem,calc(env(safe-area-inset-bottom)+3.5rem)))] md:pb-0">
            {children}
          </div>
          <BottomNav />
        </div>
      </HomeSearchProvider>
    );
  }

  return (
    <HomeSearchProvider enabled={isHome || isSearch}>
      <div className="flex min-h-full flex-col">
        <Header />
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pt-6 pb-28 lg:px-6 lg:pb-16">
          {children}
        </main>
        <BottomNav />
      </div>
    </HomeSearchProvider>
  );
}
