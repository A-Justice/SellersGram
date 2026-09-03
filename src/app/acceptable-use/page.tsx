import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Acceptable Use Policy",
  description:
    "Rules for using Vendors Gram — what sellers and buyers may and may not do on the platform.",
};

const sections: { title: string; body: string[] }[] = [
  {
    title: "1. Purpose",
    body: [
      "Vendors Gram is a classifieds marketplace for Ghana. People list goods and services; buyers contact sellers directly to arrange inspection, payment, pickup, or delivery. This Acceptable Use Policy explains what is allowed on the platform and what we prohibit.",
    ],
  },
  {
    title: "2. Who this applies to",
    body: [
      "This policy applies to everyone who uses Vendors Gram — including buyers, sellers, and visitors — whether through our website, PWA, or related services at vendorsgram.com.",
    ],
  },
  {
    title: "3. Account requirements",
    body: [
      "You must provide accurate information when you create an account (including a verified phone number and your name).",
      "You may not create accounts for others without permission, impersonate any person or business, or use another person’s identity documents or contact details.",
      "You are responsible for activity under your account. Keep your login details secure.",
    ],
  },
  {
    title: "4. Allowed use",
    body: [
      "Post lawful listings for goods or services you are entitled to sell.",
      "Communicate with other users about listings in good faith via in-app chat or the contact details you choose to share.",
      "Pay for optional platform services such as listing boosts when you choose to promote an ad.",
      "Report listings or behaviour that appear fraudulent, unsafe, or otherwise in breach of this policy.",
    ],
  },
  {
    title: "5. Prohibited items and services",
    body: [
      "You must not list, promote, or facilitate anything that is illegal under Ghanaian law or that we reasonably consider harmful, including but not limited to:",
      "Illegal drugs, controlled substances, or drug paraphernalia.",
      "Weapons, explosives, or ammunition where listing or sale is restricted or unlawful.",
      "Stolen property, counterfeit goods, or items you do not have the right to sell.",
      "Fraudulent financial schemes, money laundering, or pyramid / Ponzi schemes.",
      "Sexual services, child sexual abuse material, or any content involving minors in a sexual context.",
      "Human trafficking, endangered wildlife, or other prohibited trade.",
      "Hazardous materials that cannot lawfully be sold or transported as advertised.",
    ],
  },
  {
    title: "6. Prohibited behaviour",
    body: [
      "Scams, phishing, social engineering, or collecting payments without intent to deliver.",
      "Harassment, threats, hate speech, or discrimination.",
      "Spam, bulk unsolicited messages, or manipulating search / boost features unfairly.",
      "Uploading malware, attempting to breach our systems, or scraping data without permission.",
      "Circumventing suspensions, bans, or safety controls.",
      "Using Vendors Gram to process or disguise proceeds of crime.",
    ],
  },
  {
    title: "7. Listings and content",
    body: [
      "Listing titles, descriptions, photos, and optional video links must be accurate and not misleading.",
      "Do not use another seller’s photos or branding without permission.",
      "Category-specific details should be truthful; do not hide material defects.",
      "We may remove or refuse content that violates this policy or our safety guidelines.",
    ],
  },
  {
    title: "8. Payments on Vendors Gram",
    body: [
      "Payment for goods or services is arranged directly between buyer and seller. Vendors Gram is not a fulfilment centre and does not hold inventory or ship products on behalf of sellers.",
      "Payments made to Vendors Gram through Paystack (for example, listing boosts) are for platform promotion services only, not for the underlying sale of goods between users.",
    ],
  },
  {
    title: "9. Enforcement",
    body: [
      "We may review listings and accounts, remove content, restrict features, suspend or permanently ban accounts, and cooperate with law enforcement where required.",
      "Users may report concerns through the platform. Our team reviews reports and takes action where appropriate. See also our disputes guidance.",
    ],
  },
  {
    title: "10. Changes",
    body: [
      "We may update this policy from time to time. The version published at vendorsgram.com/acceptable-use is the current version. Continued use of the platform after changes means you accept the updated policy.",
    ],
  },
  {
    title: "11. Contact",
    body: [
      "Questions about this policy: info@vendorsgram.com",
    ],
  },
];

export default function AcceptableUsePage() {
  return (
    <article className="mx-auto max-w-2xl space-y-8 pb-8">
      <header className="space-y-3">
        <p className="text-sm text-muted">Legal · Last updated 3 September 2026</p>
        <h1 className="font-display text-4xl tracking-tight">Acceptable Use Policy</h1>
        <p className="text-muted leading-relaxed">
          Rules for using Vendors Gram safely and lawfully. By using the
          platform you agree to follow this policy together with our{" "}
          <Link href="/safety" className="font-medium text-accent underline">
            safety tips
          </Link>{" "}
          and{" "}
          <Link href="/disputes" className="font-medium text-accent underline">
            dispute process
          </Link>
          .
        </p>
      </header>

      {sections.map((section) => (
        <section key={section.title} className="space-y-3">
          <h2 className="font-display text-xl tracking-tight">{section.title}</h2>
          <ul className="space-y-2 text-sm leading-relaxed text-ink">
            {section.body.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      ))}
    </article>
  );
}
