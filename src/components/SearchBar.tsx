"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Search } from "lucide-react";
import { REGIONS } from "@/lib/regions";

export function SearchBar({
  size = "lg",
  defaultQuery = "",
  defaultRegion = "",
}: {
  size?: "lg" | "sm";
  defaultQuery?: string;
  defaultRegion?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultQuery);
  const [region, setRegion] = useState(defaultRegion);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next = new URLSearchParams();
    if (query.trim()) next.set("q", query.trim());
    if (region) next.set("region", region);
    router.push(next.toString() ? `/search?${next}` : "/search");
  }

  const large = size === "lg";

  return (
    <form
      onSubmit={onSubmit}
      className={`flex w-full items-center bg-paper shadow-[0_0_0_1px_var(--color-line)] ${
        large
          ? "h-16 rounded-[22px] p-1.5"
          : "h-12 rounded-2xl p-1"
      }`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3 px-4">
        <Search className="size-5 shrink-0 text-muted" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="What are you looking for?"
          className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-muted"
        />
      </div>
      <div className="hidden h-8 w-px bg-line sm:block" />
      <select
        value={region}
        onChange={(event) => setRegion(event.target.value)}
        className="hidden max-w-[180px] bg-transparent px-3 text-sm text-ink outline-none sm:block"
      >
        <option value="">All Ghana</option>
        {REGIONS.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className={`shrink-0 bg-ink font-medium text-paper transition hover:bg-accent ${
        large ? "h-[3.25rem] rounded-[18px] px-6" : "h-10 rounded-xl px-4 text-sm"
        }`}
      >
        Search
      </button>
    </form>
  );
}
