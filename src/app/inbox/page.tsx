"use client";

import Link from "next/link";
import { FormEvent, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
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
  const [mobileChatOpen, setMobileChatOpen] = useState(Boolean(threadParam));
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [unsentMessages, setUnsentMessages] = useState<
    { id: string; text: string; createdAt: string }[]
  >([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [pending, setPending] = useState<"clear" | ChatMessage | null>(null);
  const [busy, setBusy] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevActiveIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (threadParam) {
      setActiveId(threadParam);
      setMobileChatOpen(true);
    }
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

  useEffect(() => {
    setUnsentMessages([]);
  }, [activeId]);

  useEffect(() => {
    if (!user?.uid) return;
    setUnsentMessages((current) =>
      current.filter(
        (unsent) =>
          !messages.some(
            (message) =>
              message.fromUid === user.uid &&
              message.text === unsent.text &&
              new Date(message.createdAt).getTime() >=
                new Date(unsent.createdAt).getTime() - 2000,
          ),
      ),
    );
  }, [messages, user?.uid]);

  const active = useMemo(
    () => threads.find((thread) => thread.id === activeId) || null,
    [threads, activeId],
  );

  const displayMessages = useMemo((): ChatMessage[] => {
    if (!active || !user) return messages;
    const from: "buyer" | "seller" =
      user.uid === active.sellerId ? "seller" : "buyer";
    const optimistic = unsentMessages.map((item) => ({
      id: item.id,
      threadId: active.id,
      fromUid: user.uid,
      from,
      text: item.text,
      createdAt: item.createdAt,
      clientPending: true,
    }));
    return [...messages, ...optimistic];
  }, [messages, unsentMessages, active, user]);

  const lastMessageId = displayMessages.at(-1)?.id ?? "";

  useEffect(() => {
    if (!activeId || !displayMessages.length) return;
    const behavior =
      prevActiveIdRef.current === activeId ? "smooth" : "auto";
    prevActiveIdRef.current = activeId;
    messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
  }, [activeId, lastMessageId, displayMessages.length]);

  function onSend(event: FormEvent) {
    event.preventDefault();
    if (!active || !user || !draft.trim()) return;
    const text = draft.trim();
    setDraft("");
    setUnsentMessages((items) => [
      ...items,
      { id: `pending-${Date.now()}`, text, createdAt: new Date().toISOString() },
    ]);
    void sendMessage(active, user, text);
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
        setMobileChatOpen(false);
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
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] bg-paper shadow-[0_0_0_1px_var(--color-line)] lg:grid lg:grid-cols-[320px_1fr]">
      <aside
        className={`min-h-0 flex-col border-line lg:flex lg:border-r ${
          mobileChatOpen ? "hidden lg:flex" : "flex flex-1"
        }`}
      >
        <div className="shrink-0 p-5">
          <h1 className="font-display text-2xl">Inbox</h1>
          <p className="text-sm text-muted">Chat, edit, or clear a conversation.</p>
        </div>
        <ul className="scroll-soft min-h-0 flex-1 overflow-y-auto pb-2">
          {threads.map((thread) => (
            <li key={thread.id}>
              <button
                type="button"
                onClick={() => {
                  setActiveId(thread.id);
                  setMobileChatOpen(true);
                }}
                className={`flex w-full items-center gap-3 px-5 py-3 text-left ${
                  thread.id === activeId ? "bg-canvas" : ""
                }`}
              >
                <span className="relative h-12 w-12 overflow-hidden rounded-2xl bg-line">
                  <RemoteImage src={thread.listingPhoto || ""} alt="" className="object-cover" />
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
          {!threads.length && (
            <li className="px-5 py-8 text-sm text-muted">
              No chats yet. Open an ad and tap Chat.
            </li>
          )}
        </ul>
      </aside>
      <section
        className={`min-h-0 flex-col overflow-hidden ${
          mobileChatOpen ? "flex flex-1" : "hidden lg:flex lg:flex-1"
        }`}
      >
        {active ? (
          <>
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-line px-4 py-4 sm:px-5">
              <div className="flex min-w-0 items-start gap-2">
                <button
                  type="button"
                  aria-label="Back to conversations"
                  className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-canvas lg:hidden"
                  onClick={() => setMobileChatOpen(false)}
                >
                  <ArrowLeft className="size-4" />
                </button>
                <div className="min-w-0">
                  <Link href={`/listing/${active.listingId}`} className="font-medium">
                    {active.listingTitle}
                  </Link>
                  <p className="text-xs text-muted">
                    {active.buyerName} · {active.sellerName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="shrink-0 text-sm text-red-700"
                onClick={() => setPending("clear")}
              >
                Clear chat
              </button>
            </div>
            <div className="scroll-soft min-h-0 flex-1 space-y-3 overflow-y-auto p-5">
              {displayMessages.map((message) => {
                const mine =
                  message.fromUid === user.uid ||
                  (message.from === "seller" && user.uid === active.sellerId);
                const editing = editingId === message.id;
                const isPending = message.clientPending;
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
                          <p
                            className={`mt-1 flex items-center gap-1 text-[10px] ${
                              mine ? "text-paper/60" : "text-muted"
                            }`}
                          >
                            <span>
                              {isPending ? "Sending" : timeAgo(message.createdAt)}
                              {message.editedAt ? " · Edited" : ""}
                            </span>
                            {mine && !isPending ? (
                              <Check className="size-3 shrink-0" aria-label="Sent" />
                            ) : null}
                          </p>
                        </>
                      )}
                    </div>
                    {mine && !editing && !isPending && (
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
              <div ref={messagesEndRef} aria-hidden />
            </div>
            <form
              onSubmit={(event) => void onSend(event)}
              className="flex shrink-0 gap-2 border-t border-line p-4"
            >
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
