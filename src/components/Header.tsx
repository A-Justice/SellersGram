"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MessageCircle, Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "./Logo";
import { NotificationBell } from "./NotificationBell";
import { SearchBar } from "./SearchBar";

export function Header() {
  const { user, loading, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const hideSearch =
    pathname === "/" ||
    pathname.startsWith("/search") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login");

  async function logOut() {
    await signOut();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-canvas/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 lg:h-[4.25rem] lg:px-6">
        <Logo />
        {!hideSearch && (
          <div className="hidden min-w-0 flex-1 md:block">
            <SearchBar size="sm" />
          </div>
        )}
        <div className="ml-auto flex items-center gap-2">
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
