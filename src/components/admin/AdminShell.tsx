"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/listings", label: "Listings" },
  { href: "/admin/sellers", label: "Sellers" },
  { href: "/admin/boosts", label: "Boosts" },
  { href: "/admin/reports", label: "Reports" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && user?.role !== "admin") router.push("/login?next=/admin");
  }, [user, loading, router]);

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
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-6 lg:grid-cols-[200px_1fr] lg:px-6">
        <aside className="space-y-6">
          <Logo />
          <nav className="space-y-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-2xl px-3 py-2 text-sm ${
                  pathname === item.href ? "bg-ink text-paper" : "text-muted hover:bg-paper"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Link href="/" className="block px-3 text-sm text-muted">
            Back to site
          </Link>
          <button
            type="button"
            onClick={() => void logOut()}
            className="block w-full rounded-2xl px-3 py-2 text-left text-sm text-ink hover:bg-paper"
          >
            Log out
          </button>
        </aside>
        <div className="pb-16">{children}</div>
      </div>
    </div>
  );
}
