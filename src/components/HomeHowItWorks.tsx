/** Short explainer strip — kept out of the first viewport of ads. */
export function HomeHowItWorks() {
  return (
    <section className="grid gap-4 rounded-[28px] bg-paper p-6 shadow-[0_0_0_1px_var(--color-line)] sm:grid-cols-3 sm:p-8">
      {[
        [
          "Post an ad",
          "Photos, price, place. A few steps and you are live — free for students and everyone.",
        ],
        [
          "Talk direct",
          "Chat in the app or call. Meet on campus or somewhere public.",
        ],
        [
          "Stay local",
          "Search by region and city across Ghana, from hostel finds to beyond campus.",
        ],
      ].map(([title, copy]) => (
        <div key={title}>
          <h3 className="font-display text-xl">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">{copy}</p>
        </div>
      ))}
    </section>
  );
}
