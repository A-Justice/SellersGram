"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "./BottomNav";
import { Footer } from "./Footer";
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
  // Use /sell/ or exact /sell — not startsWith("/sell"), which also matches /seller/...
  return (
    isAccountArea(pathname) ||
    pathname === "/sell" ||
    pathname.startsWith("/sell/")
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const admin = pathname.startsWith("/admin");
  const fixedShell = isFixedShell(pathname);
  const isHome = pathname === "/";
  const isSearch = pathname.startsWith("/search");

  if (admin) return <>{children}</>;

  // Matches Header bar height (h-16 / lg:h-[4.25rem]) so content clears the fixed header.
  const headerSpacer = (
    <div className="h-16 shrink-0 lg:h-[4.25rem]" aria-hidden />
  );

  if (fixedShell) {
    return (
      <HomeSearchProvider enabled={false}>
        <div className="flex h-dvh flex-col overflow-hidden bg-canvas">
          <Header />
          {headerSpacer}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden pb-[calc(max(4.5rem,calc(env(safe-area-inset-bottom)+3.5rem)))] md:pb-0">
            {children}
          </div>
          <BottomNav />
        </div>
      </HomeSearchProvider>
    );
  }

  return (
    <HomeSearchProvider enabled={isHome || isSearch}>
      <div className="flex min-h-dvh flex-col">
        <Header />
        {headerSpacer}
        <main className="mx-auto w-full min-w-0 max-w-6xl flex-1 overflow-x-hidden px-5 pt-6 pb-10 sm:px-6 lg:px-8 lg:pb-12">
          {children}
        </main>
        <div className="pb-28 lg:pb-0">
          <Footer />
        </div>
        <BottomNav />
      </div>
    </HomeSearchProvider>
  );
}
