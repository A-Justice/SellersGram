"use client";

import Link from "next/link";
import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PageSkeleton } from "@/components/PageSkeleton";
import { RemoteImage } from "@/components/RemoteImage";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationsContext";
import {
  clearThread,
  deleteMessage,
  editMessage,
  sendMessage,
  subscribeMessages,
  subscribeThreads,
} from "@/lib/chat-store";
import { timeAgo } from "@/lib/format";
import { markAllNotificationsRead } from "@/lib/notifications-store";
import type { ChatMessage, ChatThread } from "@/data/types";

function Inbox() {
  const { user, loading } = useAuth();
  const { items } = useNotifications();
  const threadParam = useSearchParams().get("thread");
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(threadParam);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [pending, setPending] = useState<"clear" | ChatMessage | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (threadParam) setActiveId(threadParam);
  }, [threadParam]);

  useEffect(() => {
    if (!user) return;
    return subscribeThreads(user.uid, (next) => {
      setThreads(next);
      setActiveId((current) => {
        if (threadParam && next.some((thread) => thread.id === threadParam)) {
          return threadParam;
        }
        if (current && next.some((thread) => thread.id === current)) return current;
        return next[0]?.id || null;
      });
    });
  }, [user, threadParam]);

  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    setEditingId(null);
    return subscribeMessages(activeId, setMessages);
  }, [activeId]);

  useEffect(() => {
    if (!activeId) return;
    const related = items.filter(
      (item) =>
        !item.read &&
        (item.threadId === activeId || item.href.includes(activeId)),
    );
    if (related.length) void markAllNotificationsRead(related);
  }, [activeId, items]);

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

  async function saveEdit() {
    if (!active || !editingId) return;
    const message = messages.find((item) => item.id === editingId);
    if (!message) return;
    await editMessage(active, message, editText, messages);
    setEditingId(null);
  }

  async function confirmPending() {
    if (!active || !pending) return;
    setBusy(true);
    try {
      if (pending === "clear") {
        const id = active.id;
        await clearThread(active);
        setActiveId((current) => (current === id ? null : current));
      } else {
        await deleteMessage(active, pending, messages);
      }
      setPending(null);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <PageSkeleton />;

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
          <p className="text-sm text-muted">Chat, edit, or clear a conversation.</p>
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
            <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
              <div className="min-w-0">
                <Link href={`/listing/${active.listingId}`} className="font-medium">
                  {active.listingTitle}
                </Link>
                <p className="text-xs text-muted">
                  {active.buyerName} · {active.sellerName}
                </p>
              </div>
              <button
                type="button"
                className="shrink-0 text-sm text-red-700"
                onClick={() => setPending("clear")}
              >
                Clear chat
              </button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {messages.map((message) => {
                const mine =
                  message.fromUid === user.uid ||
                  (message.from === "seller" && user.uid === active.sellerId);
                const editing = editingId === message.id;
                return (
                  <div
                    key={message.id}
                    className={`max-w-[80%] ${mine ? "ml-auto" : ""}`}
                  >
                    <div
                      className={`rounded-3xl px-4 py-2.5 text-sm ${
                        mine ? "bg-ink text-paper" : "bg-canvas"
                      }`}
                    >
                      {editing ? (
                        <form
                          className="space-y-2"
                          onSubmit={(event) => {
                            event.preventDefault();
                            void saveEdit();
                          }}
                        >
                          <textarea
                            value={editText}
                            onChange={(event) => setEditText(event.target.value)}
                            className="h-20 w-full resize-none rounded-2xl bg-paper px-3 py-2 text-ink outline-none"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              className="text-xs text-paper/70"
                              onClick={() => setEditingId(null)}
                            >
                              Cancel
                            </button>
                            <button type="submit" className="text-xs font-medium">
                              Save
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <p>{message.text}</p>
                          <p className={`mt-1 text-[10px] ${mine ? "text-paper/60" : "text-muted"}`}>
                            {timeAgo(message.createdAt)}
                            {message.editedAt ? " · Edited" : ""}
                          </p>
                        </>
                      )}
                    </div>
                    {mine && !editing && (
                      <div className="mt-1 flex justify-end gap-3 px-1 text-[11px] text-muted">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(message.id);
                            setEditText(message.text);
                          }}
                        >
                          Edit
                        </button>
                        <button type="button" onClick={() => setPending(message)}>
                          Delete
                        </button>
                      </div>
                    )}
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
      {pending && (
        <ConfirmDialog
          heading={pending === "clear" ? "Clear this chat?" : "Delete this message?"}
          body={
            pending === "clear"
              ? "All messages in this conversation will be removed for both of you. This cannot be undone."
              : "This message will be removed from the conversation. This cannot be undone."
          }
          cancelLabel={pending === "clear" ? "Keep chat" : "Keep message"}
          confirmLabel={pending === "clear" ? "Clear chat" : "Delete"}
          busy={busy}
          onCancel={() => {
            if (!busy) setPending(null);
          }}
          onConfirm={() => void confirmPending()}
        />
      )}
    </div>
  );
}

export default function InboxPage() {
  return (
    <Suspense>
      <Inbox />
    </Suspense>
  );
}
