"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "./BottomNav";
import { Header } from "./Header";
import { HomeSearchProvider } from "@/context/HomeSearchContext";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const admin = pathname.startsWith("/admin");
  const fixedHeightPage =
    pathname === "/inbox" || pathname === "/notifications";
  const isHome = pathname === "/";
  const isSearch = pathname.startsWith("/search");

  if (admin) return <>{children}</>;

  return (
    <HomeSearchProvider enabled={isHome || isSearch}>
      <div
        className={`flex flex-col ${fixedHeightPage ? "shell-fixed-height h-dvh overflow-hidden" : "min-h-full"}`}
      >
        <Header />
        <main
          className={`mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 lg:px-6 ${
            fixedHeightPage
              ? "min-h-0 overflow-hidden pt-6 pb-[calc(1.5rem+max(4.5rem,calc(env(safe-area-inset-bottom)+3.5rem)))] md:pb-6"
              : "flex-1 pt-6 pb-28 lg:pb-16"
          }`}
        >
          {children}
        </main>
        <BottomNav />
      </div>
    </HomeSearchProvider>
  );
}
