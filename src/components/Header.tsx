"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MessageCircle, Plus, Search, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useHomeSearch, DOCKED_SEARCH_VISIBLE } from "@/context/HomeSearchContext";
import { Logo } from "./Logo";
import { NotificationBell } from "./NotificationBell";
import { SearchBar } from "./SearchBar";

export function Header() {
  const { user, loading, signOut } = useAuth();
  const { docked, query, setQuery, region, setRegion } = useHomeSearch();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const isHome = pathname === "/";
  const isSearch = pathname.startsWith("/search");
  const dockedSearchPage = (isHome || isSearch) && docked > DOCKED_SEARCH_VISIBLE;
  const hideSearch =
    pathname.startsWith("/admin") || pathname.startsWith("/login");
  const showMobileSearch = mobileSearchOpen && !hideSearch;

  useEffect(() => {
    setMobileSearchOpen(false);
  }, [pathname]);

  async function logOut() {
    await signOut();
    router.push("/");
  }

  function closeMobileSearch() {
    setMobileSearchOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-canvas/85 backdrop-blur-xl">
      {showMobileSearch ? (
        <div className="mx-auto flex h-16 items-center gap-2 px-4 md:hidden">
          <button
            type="button"
            aria-label="Close search"
            className="inline-flex shrink-0 rounded-full p-2.5 text-ink hover:bg-paper"
            onClick={closeMobileSearch}
          >
            <X className="size-5" />
          </button>
          <div className="min-w-0 flex-1">
            <SearchBar
              size="sm"
              query={query}
              region={region}
              onQueryChange={setQuery}
              onRegionChange={setRegion}
              autoFocus
              onSearched={closeMobileSearch}
            />
          </div>
        </div>
      ) : null}

      <div
        className={`mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 lg:h-[4.25rem] lg:px-6 ${
          showMobileSearch ? "hidden md:flex" : "flex"
        }`}
      >
        <Logo />
        {(!hideSearch || isHome || isSearch) && (
          <div
            className={`hidden min-w-0 md:block transition-[opacity,transform,max-width] duration-300 ease-out ${
              isHome || isSearch
                ? dockedSearchPage
                  ? "max-w-none flex-1 translate-y-0 opacity-100"
                  : "pointer-events-none max-w-0 flex-[0] overflow-hidden opacity-0"
                : "flex-1 opacity-100"
            }`}
            aria-hidden={isHome || isSearch ? !dockedSearchPage : false}
          >
            <SearchBar
              size="sm"
              query={query}
              region={region}
              onQueryChange={setQuery}
              onRegionChange={setRegion}
            />
          </div>
        )}
        <div className="ml-auto flex items-center gap-2">
          {((!hideSearch && !isHome && !isSearch) || dockedSearchPage) && (
            <button
              type="button"
              aria-label="Search"
              className="inline-flex rounded-full p-2.5 text-ink hover:bg-paper md:hidden"
              onClick={() => setMobileSearchOpen(true)}
            >
              <Search className="size-5" />
            </button>
          )}
          {user && <NotificationBell />}
          <Link
            href="/inbox"
            className="hidden rounded-full p-2.5 text-ink hover:bg-paper sm:inline-flex"
            aria-label="Inbox"
          >
            <MessageCircle className="size-5" />
          </Link>
          <Link
            href="/sell"
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-ink px-4 text-sm font-medium text-paper hover:bg-accent"
          >
            <Plus className="size-4" />
            Sell
          </Link>
          {loading ? (
            <span className="skeleton h-10 w-10 rounded-full md:w-24" />
          ) : user ? (
            <>
              <Link
                href="/account"
                className="grid h-10 w-10 place-items-center rounded-full bg-paper text-sm font-semibold text-ink shadow-[0_0_0_1px_var(--color-line)]"
                aria-label="Account"
              >
                {user.name.slice(0, 1)}
              </Link>
              <button
                type="button"
                onClick={() => void logOut()}
                className="hidden h-10 items-center px-3 text-sm font-medium text-ink hover:text-accent md:inline-flex"
              >
                Log out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="inline-flex h-10 items-center rounded-full px-4 text-sm font-medium text-ink hover:bg-paper"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
