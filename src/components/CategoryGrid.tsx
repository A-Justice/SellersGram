import Link from "next/link";
import {
  Armchair,
  Car,
  Cpu,
  HeartPulse,
  Home,
  PawPrint,
  Shirt,
  Smartphone,
  Sparkles,
  Tractor,
} from "lucide-react";
import { CATEGORIES } from "@/lib/categories";

const icons = {
  phones: Smartphone,
  electronics: Cpu,
  home: Armchair,
  fashion: Shirt,
  vehicles: Car,
  property: Home,
  beauty: Sparkles,
  services: HeartPulse,
  farm: Tractor,
  pets: PawPrint,
};

export function CategoryGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {CATEGORIES.map((category) => {
        const Icon = icons[category.id as keyof typeof icons] || Smartphone;
        return (
          <Link
            key={category.id}
            href={`/c/${category.id}`}
            className="group rounded-[22px] bg-paper p-4 shadow-[0_0_0_1px_var(--color-line)] transition hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_var(--color-ink)]"
          >
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-canvas text-accent">
              <Icon className="size-5" />
            </span>
            <p className="mt-3 font-medium leading-tight text-ink">{category.name}</p>
            <p className="mt-1 text-xs text-muted">{category.hint}</p>
          </Link>
        );
      })}
    </div>
  );
}
