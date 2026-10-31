import type { Metadata } from "next";
import Link from "next/link";
import { siteOrigin } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Stay safe when buying and selling",
  description:
    "Safety tips for campus and local deals on Vendors Gram — meet in public, check before you pay, prefer in-app chat, and report anything off.",
  alternates: { canonical: `${siteOrigin()}/safety` },
};

export default function SafetyPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-4xl tracking-tight">Stay safe</h1>
      <p className="text-muted">
        Deals happen between you and the other person. Check the item before
        you pay.
      </p>
      <ul className="space-y-3 text-sm leading-relaxed">
        <li>Meet in a public place.</li>
        <li>Check the item before you pay.</li>
        <li>Do not pay in advance, even for delivery.</li>
        <li>Prefer in-app chat so you have a record.</li>
        <li>Report anything that feels off. Admin will review it.</li>
      </ul>
      <p className="text-sm text-muted">
        More detail:{" "}
        <Link href="/acceptable-use" className="font-medium text-accent underline">
          Acceptable Use Policy
        </Link>
        {" · "}
        <Link href="/disputes" className="font-medium text-accent underline">
          Disputes & reports
        </Link>
      </p>
    </article>
  );
}
