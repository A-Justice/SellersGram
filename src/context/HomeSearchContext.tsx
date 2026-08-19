"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

type HomeSearchContextValue = {
  heroRef: RefObject<HTMLDivElement | null>;
  docked: number;
  query: string;
  setQuery: (value: string) => void;
  region: string;
  setRegion: (value: string) => void;
};

const HomeSearchContext = createContext<HomeSearchContextValue | null>(null);

export function HomeSearchProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: React.ReactNode;
}) {
  const heroRef = useRef<HTMLDivElement>(null);
  const [docked, setDocked] = useState(0);
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("");

  useEffect(() => {
    if (!enabled) {
      setDocked(0);
      return;
    }

    let frame = 0;
    let observer: ResizeObserver | null = null;
    let pollId = 0;

    const update = () => {
      const hero = heroRef.current;
      const header = document.querySelector("header");
      if (!hero || !header) {
        setDocked(0);
        return;
      }

      const headerBottom = header.getBoundingClientRect().bottom;
      const heroRect = hero.getBoundingClientRect();
      const gap = 16;

      if (heroRect.bottom > headerBottom + gap) {
        setDocked(0);
        return;
      }

      if (heroRect.top <= headerBottom - 4) {
        setDocked(1);
        return;
      }

      const range = Math.max(heroRect.height + gap, 1);
      const next = 1 - (heroRect.bottom - headerBottom - gap) / range;
      setDocked(Math.min(1, Math.max(0, next)));
    };

    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };

    const watchHero = (node: HTMLDivElement) => {
      observer?.disconnect();
      observer = new ResizeObserver(onScroll);
      observer.observe(node);
    };

    update();
    if (heroRef.current) watchHero(heroRef.current);

    pollId = window.setInterval(() => {
      const hero = heroRef.current;
      if (!hero) return;
      watchHero(hero);
      update();
    }, 120);

    window.setTimeout(() => window.clearInterval(pollId), 2500);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.clearInterval(pollId);
      observer?.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [enabled]);

  return (
    <HomeSearchContext.Provider
      value={{ heroRef, docked, query, setQuery, region, setRegion }}
    >
      {children}
    </HomeSearchContext.Provider>
  );
}

export function useHomeSearch() {
  const context = useContext(HomeSearchContext);
  return (
    context ?? {
      heroRef: { current: null },
      docked: 0,
      query: "",
      setQuery: () => undefined,
      region: "",
      setRegion: () => undefined,
    }
  );
}

export const DOCKED_SEARCH_VISIBLE = 0.42;
