import Link from "next/link";
import {
  Armchair,
  Baby,
  Briefcase,
  Car,
  Cpu,
  Dumbbell,
  HeartPulse,
  Home,
  MoreHorizontal,
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
  jobs: Briefcase,
  sports: Dumbbell,
  babies: Baby,
  other: MoreHorizontal,
};

export function CategoryGrid() {
  return (
    <div className="-mx-1 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex w-max gap-2.5 px-1">
        {CATEGORIES.map((category) => {
          const Icon = icons[category.id as keyof typeof icons] || Smartphone;
          return (
            <Link
              key={category.id}
              href={`/c/${category.id}`}
              className="group flex w-[7.75rem] shrink-0 flex-col rounded-[20px] bg-paper p-3 shadow-[0_0_0_1px_var(--color-line)] transition hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_var(--color-ink)] sm:w-[8.5rem] sm:p-3.5"
            >
              <span className="grid size-9 place-items-center rounded-2xl bg-canvas text-accent sm:size-10">
                <Icon className="size-4 sm:size-5" />
              </span>
              <p className="mt-2.5 text-sm font-medium leading-snug text-ink">
                {category.name}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
