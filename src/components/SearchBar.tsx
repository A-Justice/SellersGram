"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Select } from "@/components/Select";
import { REGIONS } from "@/lib/regions";

export function SearchBar({
  size = "lg",
  defaultQuery = "",
  defaultRegion = "",
  query: controlledQuery,
  region: controlledRegion,
  onQueryChange,
  onRegionChange,
  autoFocus = false,
  onSearched,
}: {
  size?: "lg" | "sm";
  defaultQuery?: string;
  defaultRegion?: string;
  query?: string;
  region?: string;
  onQueryChange?: (value: string) => void;
  onRegionChange?: (value: string) => void;
  autoFocus?: boolean;
  onSearched?: () => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [localQuery, setLocalQuery] = useState(defaultQuery);
  const [localRegion, setLocalRegion] = useState(defaultRegion);
  const query = controlledQuery ?? localQuery;
  const region = controlledRegion ?? localRegion;

  useEffect(() => {
    if (!autoFocus) return;
    inputRef.current?.focus();
  }, [autoFocus]);

  function setQuery(value: string) {
    if (onQueryChange) onQueryChange(value);
    else setLocalQuery(value);
  }

  function setRegion(value: string) {
    if (onRegionChange) onRegionChange(value);
    else setLocalRegion(value);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next = new URLSearchParams();
    if (query.trim()) next.set("q", query.trim());
    if (region) next.set("region", region);
    router.push(next.toString() ? `/search?${next}` : "/search");
    onSearched?.();
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
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="What are you looking for?"
          className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-muted"
        />
      </div>
      <div className="hidden h-8 w-px bg-line sm:block" />
      <div className="hidden sm:block">
        <Select
          variant="inline"
          value={region}
          onChange={setRegion}
          placeholder="All Ghana"
          options={[
            { value: "", label: "All Ghana" },
            ...REGIONS.map((item) => ({ value: item.id, label: item.name })),
          ]}
        />
      </div>
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
