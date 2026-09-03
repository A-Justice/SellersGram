import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Disputes & reports",
  description:
    "How Vendors Gram handles buyer–seller disputes, reports, and payments made for listing boosts.",
};

export default function DisputesPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-8 pb-8">
      <header className="space-y-3">
        <p className="text-sm text-muted">Help · Last updated 3 September 2026</p>
        <h1 className="font-display text-4xl tracking-tight">Disputes & reports</h1>
        <p className="text-muted leading-relaxed">
          Vendors Gram connects buyers and sellers. Deals for goods and services
          are agreed directly between users. This page explains how we help when
          something goes wrong.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="font-display text-xl tracking-tight">
          1. Buyer–seller transactions
        </h2>
        <p className="text-sm leading-relaxed">
          We are not a fulfilment centre. Sellers ship, deliver, or meet buyers
          themselves. Payment for the item is arranged between the parties. We
          recommend meeting in public, inspecting before you pay, and keeping
          communication in-app where possible. See our{" "}
          <Link href="/safety" className="font-medium text-accent underline">
            safety tips
          </Link>
          .
        </p>
        <p className="text-sm leading-relaxed">
          Refunds, exchanges, or returns for goods are primarily handled between
          the buyer and the seller. If you cannot resolve the issue, report the
          listing or user so our team can review for policy breaches, fraud, or
          scams.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl tracking-tight">2. How to report</h2>
        <ul className="space-y-2 text-sm leading-relaxed">
          <li>Use in-app reporting where available on a listing or conversation.</li>
          <li>
            Email{" "}
            <a
              href="mailto:hello@vendorsgram.com"
              className="font-medium text-accent underline"
            >
              hello@vendorsgram.com
            </a>{" "}
            with the listing link, usernames or phone numbers involved, and a
            short description of what happened.
          </li>
          <li>Include screenshots of chat or payment proof if you have them.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl tracking-tight">3. What we do</h2>
        <ul className="space-y-2 text-sm leading-relaxed">
          <li>Review open reports in our admin tools.</li>
          <li>Remove listings that break our Acceptable Use Policy.</li>
          <li>Warn, restrict, suspend, or ban accounts involved in abuse or fraud.</li>
          <li>Preserve relevant records where needed for safety or legal requests.</li>
        </ul>
        <p className="text-sm leading-relaxed">
          Full rules:{" "}
          <Link
            href="/acceptable-use"
            className="font-medium text-accent underline"
          >
            Acceptable Use Policy
          </Link>
          .
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl tracking-tight">
          4. Payments to Vendors Gram (boosts)
        </h2>
        <p className="text-sm leading-relaxed">
          If you paid Vendors Gram via Paystack for a listing boost or other
          platform fee, contact us at{" "}
          <a
            href="mailto:hello@vendorsgram.com"
            className="font-medium text-accent underline"
          >
            hello@vendorsgram.com
          </a>{" "}
          with your payment reference. Boost-related billing issues are handled
          by our support team and, where applicable, through Paystack’s dispute
          process.
        </p>
      </section>
    </article>
  );
}
