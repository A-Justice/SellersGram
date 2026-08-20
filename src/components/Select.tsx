"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type SelectOption = {
  value: string;
  label: string;
};

type PanelPosition = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

export function Select({
  value,
  onChange,
  options,
  placeholder = "Choose one",
  className = "",
  variant = "field",
  searchable,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  variant?: "field" | "inline";
  /** Enable search when true, or auto when there are many options. */
  searchable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [panel, setPanel] = useState<PanelPosition | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const selected = options.find((option) => option.value === value);
  const canSearch = searchable ?? options.length > 12;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((option) => option.label.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    if (canSearch) {
      const id = window.setTimeout(() => searchRef.current?.focus(), 0);
      return () => window.clearTimeout(id);
    }
  }, [open, canSearch]);

  useLayoutEffect(() => {
    if (!open) {
      setPanel(null);
      return;
    }

    const update = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const width = variant === "inline" ? Math.max(220, rect.width) : rect.width;
      const left =
        variant === "inline"
          ? Math.min(rect.right - width, window.innerWidth - width - 12)
          : Math.min(rect.left, window.innerWidth - width - 12);
      const spaceBelow = window.innerHeight - rect.bottom - 12;
      const spaceAbove = rect.top - 12;
      const preferBelow = spaceBelow >= 180 || spaceBelow >= spaceAbove;
      const maxHeight = Math.min(
        canSearch ? 320 : 256,
        preferBelow ? spaceBelow - 8 : spaceAbove - 8,
      );
      const top = preferBelow ? rect.bottom + 8 : rect.top - maxHeight - 8;

      setPanel({
        top: Math.max(8, top),
        left: Math.max(12, left),
        width,
        maxHeight: Math.max(120, maxHeight),
      });
    };

    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, variant, canSearch]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      const portal = document.getElementById(`select-panel-${listId}`);
      if (portal?.contains(target)) return;
      setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, listId]);

  const shellClass =
    "overflow-hidden rounded-[18px] bg-paper shadow-[0_18px_40px_rgba(20,17,14,0.12),0_0_0_1px_var(--color-line)]";

  const listMaxHeight =
    panel && canSearch ? Math.max(80, panel.maxHeight - 52) : panel?.maxHeight;

  const list = (
    <div
      id={`select-panel-${listId}`}
      className={shellClass}
      style={
        panel
          ? {
              position: "fixed",
              top: panel.top,
              left: panel.left,
              width: panel.width,
              maxHeight: panel.maxHeight,
              zIndex: 9999,
            }
          : undefined
      }
    >
      {canSearch ? (
        <div className="border-b border-line p-2">
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search…"
            className="h-9 w-full rounded-[12px] bg-canvas px-3 text-sm outline-none"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}
      <ul
        role="listbox"
        aria-labelledby={`select-trigger-${listId}`}
        className="select-panel-scroll max-h-[inherit] overflow-y-auto overscroll-contain p-1.5"
        style={listMaxHeight ? { maxHeight: listMaxHeight } : undefined}
      >
        {filtered.length === 0 ? (
          <li className="px-3 py-2.5 text-sm text-muted">No matches</li>
        ) : (
          filtered.map((option) => {
            const active = option.value === value;
            return (
              <li key={option.value || "__empty"} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-3 rounded-[14px] px-3 py-2.5 text-left text-sm transition ${
                    active ? "bg-ink text-paper" : "text-ink hover:bg-canvas"
                  }`}
                >
                  <span className="truncate">{option.label}</span>
                  {active ? <Check className="size-4 shrink-0" /> : null}
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={triggerRef}
        id={`select-trigger-${listId}`}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`select-panel-${listId}`}
        onClick={() => setOpen((current) => !current)}
        className={`${
          variant === "inline"
            ? "flex h-full min-w-0 max-w-[180px] items-center gap-1.5 bg-transparent px-3 text-left text-sm text-ink outline-none"
            : "field flex h-11 w-full items-center justify-between gap-2 px-3 text-left"
        } ${open ? "text-ink" : ""}`}
      >
        <span className="min-w-0 truncate">{selected?.label || placeholder}</span>
        <ChevronDown
          className={`size-4 shrink-0 text-muted transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && mounted && panel ? createPortal(list, document.body) : null}
    </div>
  );
}
