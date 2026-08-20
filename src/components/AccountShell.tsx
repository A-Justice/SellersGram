"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const NAV = [
  { href: "/account", label: "Profile" },
  { href: "/my-ads", label: "My ads" },
  { href: "/inbox", label: "Inbox" },
  { href: "/notifications", label: "Notifications" },
];

type AccountNavContextValue = {
  openMenu: () => void;
};

const AccountNavContext = createContext<AccountNavContextValue | null>(null);

export function useAccountNav() {
  const context = useContext(AccountNavContext);
  if (!context) {
    throw new Error("useAccountNav must be used inside AccountShell");
  }
  return context;
}

function navActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Mobile back control + page title. Keep outside scroll regions so it stays pinned. */
export function AccountPageTitle({
  title,
  subtitle,
  titleClassName = "font-display text-4xl tracking-tight",
  actions,
}: {
  title: string;
  subtitle?: ReactNode;
  titleClassName?: string;
  actions?: ReactNode;
}) {
  const { openMenu } = useAccountNav();

  return (
    <div className="shrink-0 bg-inherit pb-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Back to account menu"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-paper shadow-[0_0_0_1px_var(--color-line)] lg:hidden"
              onClick={openMenu}
            >
              <ArrowLeft className="size-4" />
            </button>
            <h1 className={titleClassName}>{title}</h1>
          </div>
          {subtitle ? (
            <div className="mt-2 pl-11 lg:pl-0">{subtitle}</div>
          ) : null}
        </div>
        {actions ? <div className="shrink-0 pt-1">{actions}</div> : null}
      </div>
    </div>
  );
}

function AccountShellInner({ children }: { children: ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const firstMount = useRef(true);
  const [mobileNavView, setMobileNavView] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [user, loading, router, pathname]);

  useEffect(() => {
    if (firstMount.current) {
      firstMount.current = false;
      setMobileNavView(pathname === "/account" && !params.get("next"));
      return;
    }
    setMobileNavView(false);
  }, [pathname, params]);

  const openMenu = useCallback(() => setMobileNavView(true), []);

  const navValue = useMemo(() => ({ openMenu }), [openMenu]);

  async function logOut() {
    await signOut();
    router.push("/");
  }

  if (loading || !user) {
    return (
      <div className="grid h-full place-items-center text-sm text-muted">
        Checking account…
      </div>
    );
  }

  return (
    <AccountNavContext.Provider value={navValue}>
      <div className="h-full overflow-hidden bg-canvas">
        <div className="flex h-full min-h-0 px-4 py-4 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-6 lg:px-6 lg:py-6">
          <aside
            className={`min-h-0 flex-col overflow-y-auto ${
              mobileNavView ? "flex flex-1" : "hidden"
            } lg:flex lg:flex-none`}
          >
            <div className="flex items-center gap-2 px-1">
              <Link
                href="/"
                aria-label="Back to site"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-paper shadow-[0_0_0_1px_var(--color-line)] hover:text-ink"
              >
                <ArrowLeft className="size-4" />
              </Link>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                Account
              </p>
            </div>
            <nav className="mt-3 space-y-1">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-2xl px-3 py-2.5 text-sm ${
                    navActive(pathname, item.href)
                      ? "bg-ink text-paper"
                      : "text-muted hover:bg-paper"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              {user.role === "admin" ? (
                <Link
                  href="/admin"
                  className="block rounded-2xl px-3 py-2.5 text-sm text-muted hover:bg-paper"
                >
                  Admin
                </Link>
              ) : null}
            </nav>
            <button
              type="button"
              onClick={() => void logOut()}
              className="mt-6 block w-full rounded-2xl px-3 py-2.5 text-left text-sm text-ink hover:bg-paper"
            >
              Log out
            </button>
          </aside>

          <div
            className={`min-h-0 flex-col overflow-hidden ${
              mobileNavView ? "hidden" : "flex flex-1"
            } lg:flex lg:flex-1`}
          >
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              {children}
            </div>
          </div>
        </div>
      </div>
    </AccountNavContext.Provider>
  );
}

export function AccountShell({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="grid h-full place-items-center text-sm text-muted">
          Loading account…
        </div>
      }
    >
      <AccountShellInner>{children}</AccountShellInner>
    </Suspense>
  );
}
