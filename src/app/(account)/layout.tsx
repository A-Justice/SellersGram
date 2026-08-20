import type { ReactNode } from "react";
import { AccountShell } from "@/components/AccountShell";

export default function AccountAreaLayout({ children }: { children: ReactNode }) {
  return <AccountShell>{children}</AccountShell>;
}
