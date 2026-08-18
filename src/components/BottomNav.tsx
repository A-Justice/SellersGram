"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, Plus, Tag, UserRound } from "lucide-react";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/inbox", label: "Inbox", icon: MessageCircle },
  { href: "/sell", label: "Sell", icon: Plus, primary: true },
  { href: "/my-ads", label: "My ads", icon: Tag },
  { href: "/account", label: "Account", icon: UserRound },
];

export function BottomNav() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur-xl md:hidden">
      <ul className="grid grid-cols-5 items-end">
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          if (item.primary) {
            return (
              <li key={item.href} className="flex justify-center">
                <Link
                  href={item.href}
                  className="-mt-5 grid h-14 w-14 place-items-center rounded-full bg-ink text-paper shadow-[0_8px_24px_rgba(20,17,14,0.18)]"
                  aria-label="Sell"
                >
                  <Icon className="size-6" />
                </Link>
              </li>
            );
          }
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-0.5 py-2 text-[11px] ${
                  active ? "text-ink" : "text-muted"
                }`}
              >
                <Icon className="size-[22px]" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
