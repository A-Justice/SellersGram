"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/listings", label: "Listings" },
  { href: "/admin/sellers", label: "Sellers" },
  { href: "/admin/boosts", label: "Boosts" },
  { href: "/admin/reports", label: "Reports" },
];

function navLabel(pathname: string) {
  if (pathname.startsWith("/admin/sellers/")) return "Seller";
  return NAV.find((item) => item.href === pathname)?.label || "Admin";
}

function navActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const firstMount = useRef(true);
  const [mobileNavView, setMobileNavView] = useState(true);

  useEffect(() => {
    if (!loading && user?.role !== "admin") router.push("/login?next=/admin");
  }, [user, loading, router]);

  useEffect(() => {
    if (firstMount.current) {
      firstMount.current = false;
      setMobileNavView(pathname === "/admin");
      return;
    }
    setMobileNavView(false);
  }, [pathname]);

  async function logOut() {
    await signOut();
    router.push("/");
  }

  if (loading || user?.role !== "admin") {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted">
        Checking admin access…
      </div>
    );
  }

  return (
    <div className="h-dvh overflow-hidden bg-canvas">
      <div className="mx-auto flex h-full max-w-6xl min-h-0 gap-0 px-4 py-6 lg:grid lg:grid-cols-[200px_1fr] lg:gap-8 lg:px-6">
        <aside
          className={`min-h-0 flex-col overflow-y-auto ${
            mobileNavView ? "flex flex-1" : "hidden"
          } lg:flex lg:flex-none`}
        >
          <Logo />
          <nav className="mt-6 space-y-1">
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
          </nav>
          <Link href="/" className="mt-6 block px-3 text-sm text-muted">
            Back to site
          </Link>
          <button
            type="button"
            onClick={() => void logOut()}
            className="mt-2 block w-full rounded-2xl px-3 py-2.5 text-left text-sm text-ink hover:bg-paper"
          >
            Log out
          </button>
        </aside>

        <div
          className={`min-h-0 flex-col overflow-hidden ${
            mobileNavView ? "hidden" : "flex flex-1"
          } lg:flex lg:flex-1`}
        >
          <div className="mb-4 flex shrink-0 items-center gap-2 border-b border-line pb-3 lg:hidden">
            <button
              type="button"
              aria-label="Back to admin menu"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-paper shadow-[0_0_0_1px_var(--color-line)]"
              onClick={() => setMobileNavView(true)}
            >
              <ArrowLeft className="size-4" />
            </button>
            <p className="text-sm font-medium">{navLabel(pathname)}</p>
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
        </div>
      </div>
    </div>
  );
}
