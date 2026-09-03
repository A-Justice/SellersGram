import Link from "next/link";

const links = [
  { href: "/safety", label: "Safety" },
  { href: "/acceptable-use", label: "Acceptable use" },
  { href: "/disputes", label: "Disputes" },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <p className="text-xs text-muted">© {new Date().getFullYear()} Vendors Gram</p>
        <nav aria-label="Legal" className="flex flex-wrap items-center gap-x-1 gap-y-2 text-xs text-muted">
          {links.map((link, index) => (
            <span key={link.href} className="inline-flex items-center gap-x-1">
              {index > 0 && (
                <span aria-hidden className="mx-1.5 text-line select-none">
                  ·
                </span>
              )}
              <Link
                href={link.href}
                className="transition-colors hover:text-ink"
              >
                {link.label}
              </Link>
            </span>
          ))}
        </nav>
      </div>
    </footer>
  );
}
