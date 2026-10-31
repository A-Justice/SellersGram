import { HOME_FAQS } from "@/lib/seo";

/** Static FAQ block for crawlers and students — keep questions honest and specific. */
export function HomeFaq() {
  return (
    <section className="space-y-5" aria-labelledby="home-faq-heading">
      <div>
        <h2 id="home-faq-heading" className="font-display text-2xl">
          Good to know
        </h2>
        <p className="mt-1 text-sm text-muted">
          Straight answers about buying and selling on campus and beyond.
        </p>
      </div>
      <div className="divide-y divide-line rounded-[28px] bg-paper shadow-[0_0_0_1px_var(--color-line)]">
        {HOME_FAQS.map((item) => (
          <details key={item.question} className="group px-5 py-4 sm:px-6">
            <summary className="cursor-pointer list-none font-display text-lg marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="flex items-start justify-between gap-4">
                {item.question}
                <span
                  aria-hidden
                  className="mt-1 text-muted transition group-open:rotate-45"
                >
                  +
                </span>
              </span>
            </summary>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
