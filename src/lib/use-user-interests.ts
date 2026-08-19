"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import type { UserInterest } from "@/data/types";
import { subscribeUserInterests } from "@/lib/engagement-store";

export function useUserInterests() {
  const { user } = useAuth();
  const [interests, setInterests] = useState<UserInterest[]>([]);
  const [ready, setReady] = useState(!user);

  useEffect(() => {
    if (!user) {
      setInterests([]);
      setReady(true);
      return;
    }

    setReady(false);
    const unsub = subscribeUserInterests(user.uid, (next) => {
      setInterests(next);
      setReady(true);
    });
    return unsub;
  }, [user]);

  return { interests, ready };
}
