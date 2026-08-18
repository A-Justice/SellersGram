import Link from "next/link";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-2">
      <span className="relative grid h-8 w-8 place-items-center rounded-full bg-ink text-paper">
        <span className="h-2.5 w-2.5 rounded-full bg-accent" />
        <span className="absolute inset-[7px] rounded-full border border-paper/35" />
      </span>
      {!compact && (
        <span className="font-display text-[1.35rem] leading-none tracking-tight text-ink">
          sellers<span className="text-accent">gram</span>
        </span>
      )}
    </Link>
  );
}
