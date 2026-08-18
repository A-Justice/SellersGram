"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { RemoteImage } from "@/components/RemoteImage";
import { useAuth } from "@/context/AuthContext";
import { sendMessage, subscribeMessages, subscribeThreads } from "@/lib/chat-store";
import { timeAgo } from "@/lib/format";
import type { ChatMessage, ChatThread } from "@/data/types";

export default function InboxPage() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (!user) return;
    return subscribeThreads(user.uid, (next) => {
      setThreads(next);
      setActiveId((current) => current || next[0]?.id || null);
    });
  }, [user]);

  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    return subscribeMessages(activeId, setMessages);
  }, [activeId]);

  const active = useMemo(
    () => threads.find((thread) => thread.id === activeId) || null,
    [threads, activeId],
  );

  async function onSend(event: FormEvent) {
    event.preventDefault();
    if (!active || !user || !draft.trim()) return;
    await sendMessage(active, user, draft.trim());
    setDraft("");
  }

  if (!user) {
    return (
      <div className="py-16 text-center">
        <h1 className="font-display text-4xl">Inbox</h1>
        <p className="mt-2 text-sm text-muted">Sign in to chat with buyers and sellers.</p>
        <Link href="/login?next=/inbox" className="mt-5 inline-flex h-11 items-center rounded-full bg-ink px-5 text-paper">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="grid min-h-[70vh] overflow-hidden rounded-[28px] bg-paper shadow-[0_0_0_1px_var(--color-line)] lg:grid-cols-[320px_1fr]">
      <aside className="border-b border-line lg:border-b-0 lg:border-r">
        <div className="p-5">
          <h1 className="font-display text-2xl">Inbox</h1>
          <p className="text-sm text-muted">Simple text chat. That is all.</p>
        </div>
        <ul>
          {threads.map((thread) => (
            <li key={thread.id}>
              <button
                type="button"
                onClick={() => setActiveId(thread.id)}
                className={`flex w-full items-center gap-3 px-5 py-3 text-left ${
                  thread.id === activeId ? "bg-canvas" : ""
                }`}
              >
                <span className="relative h-12 w-12 overflow-hidden rounded-2xl bg-line">
                  {thread.listingPhoto && (
                    <RemoteImage src={thread.listingPhoto} alt="" className="object-cover" />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">
                    {thread.listingTitle}
                  </span>
                  <span className="block truncate text-xs text-muted">
                    {thread.lastMessage}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <section className="flex min-h-[420px] flex-col">
        {active ? (
          <>
            <div className="border-b border-line px-5 py-4">
              <Link href={`/listing/${active.listingId}`} className="font-medium">
                {active.listingTitle}
              </Link>
              <p className="text-xs text-muted">
                {active.buyerName} · {active.sellerName}
              </p>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {messages.map((message) => {
                const mine =
                  message.fromUid === user.uid ||
                  (message.from === "seller" && user.uid === active.sellerId);
                return (
                  <div
                    key={message.id}
                    className={`max-w-[80%] rounded-3xl px-4 py-2.5 text-sm ${
                      mine ? "ml-auto bg-ink text-paper" : "bg-canvas"
                    }`}
                  >
                    <p>{message.text}</p>
                    <p className={`mt-1 text-[10px] ${mine ? "text-paper/60" : "text-muted"}`}>
                      {timeAgo(message.createdAt)}
                    </p>
                  </div>
                );
              })}
            </div>
            <form onSubmit={(event) => void onSend(event)} className="flex gap-2 border-t border-line p-4">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                className="field"
                placeholder="Write a message"
              />
              <button className="h-11 rounded-full bg-ink px-5 text-sm text-paper">
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="grid flex-1 place-items-center text-sm text-muted">
            No chats yet. Open an ad and tap Chat.
          </div>
        )}
      </section>
    </div>
  );
}
