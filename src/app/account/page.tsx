"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { DeviceAlertsCard } from "@/components/DeviceAlertsCard";
import { InstallAppCard } from "@/components/InstallAppCard";
import { PageSkeleton } from "@/components/PageSkeleton";
import { useAuth } from "@/context/AuthContext";

export default function AccountPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  async function logOut() {
    await signOut();
    router.push("/");
  }

  if (loading) return <PageSkeleton />;

  if (!user) {
    return (
      <div className="py-16 text-center">
        <h1 className="font-display text-4xl">Account</h1>
        <p className="mt-2 text-sm text-muted">Sign in to sell and chat.</p>
        <Link
          href="/login"
          className="mt-5 inline-flex h-11 items-center rounded-full bg-ink px-5 text-paper"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="font-display text-4xl tracking-tight">Account</h1>
      <div className="rounded-[28px] bg-paper p-6 shadow-[0_0_0_1px_var(--color-line)]">
        <p className="text-2xl font-medium">{user.name}</p>
        <p className="mt-1 text-sm text-muted">{user.email}</p>
        <p className="mt-4 text-sm capitalize text-muted">{user.role}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/my-ads" className="inline-flex h-11 items-center rounded-full bg-canvas px-4 text-sm">
            My ads
          </Link>
          <Link href="/inbox" className="inline-flex h-11 items-center rounded-full bg-canvas px-4 text-sm">
            Inbox
          </Link>
          <Link href="/notifications" className="inline-flex h-11 items-center rounded-full bg-canvas px-4 text-sm">
            Notifications
          </Link>
          {user.role === "admin" && (
            <Link href="/admin" className="inline-flex h-11 items-center rounded-full bg-ink px-4 text-sm text-paper">
              Admin
            </Link>
          )}
        </div>
      </div>
      <InstallAppCard />
      <DeviceAlertsCard />
      <button
        type="button"
        onClick={() => void logOut()}
        className="h-12 w-full rounded-full bg-ink text-sm font-medium text-paper"
      >
        Log out
      </button>
    </div>
  );
}
