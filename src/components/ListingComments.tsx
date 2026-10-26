"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Listing, ListingComment } from "@/data/types";
import { useAuth } from "@/context/AuthContext";
import { timeAgo } from "@/lib/format";
import {
  addListingComment,
  deleteListingComment,
  groupComments,
  subscribeListingComments,
} from "@/lib/comments-store";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] || ""}${parts[1]![0] || ""}`.toUpperCase();
}

function CommentComposer({
  placeholder,
  submitLabel,
  onSubmit,
  onCancel,
  autoFocus,
}: {
  placeholder: string;
  submitLabel: string;
  onSubmit: (text: string) => Promise<void>;
  onCancel?: () => void;
  autoFocus?: boolean;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await onSubmit(text);
      setText("");
      onCancel?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post comment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        rows={2}
        maxLength={2000}
        className="w-full resize-none rounded-2xl bg-canvas px-3 py-2.5 text-sm outline-none ring-1 ring-transparent focus:ring-line"
      />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy || !text.trim()}
          onClick={() => void submit()}
          className="inline-flex h-9 items-center rounded-full bg-ink px-4 text-sm font-medium text-paper disabled:opacity-40"
        >
          {busy ? "Posting…" : submitLabel}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-9 items-center rounded-full px-3 text-sm text-muted"
          >
            Cancel
          </button>
        ) : null}
      </div>
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}

function CommentRow({
  comment,
  isSeller,
  isOwn,
  onReply,
  onDelete,
  depth = 0,
}: {
  comment: ListingComment;
  isSeller: boolean;
  isOwn: boolean;
  onReply: () => void;
  onDelete: () => void;
  depth?: number;
}) {
  return (
    <div className={`flex gap-3 ${depth ? "mt-4" : ""}`}>
      <div className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-xs font-medium text-paper">
        {initials(comment.authorName)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-sm font-medium">{comment.authorName}</span>
          {isSeller ? (
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-dark">
              Seller
            </span>
          ) : null}
          <span className="text-xs text-muted">{timeAgo(comment.createdAt)}</span>
        </div>
        <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-ink/90">
          {comment.text}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onReply}
            className="text-xs font-medium text-muted hover:text-ink"
          >
            Reply
          </button>
          {isOwn ? (
            <button
              type="button"
              onClick={onDelete}
              className="text-xs font-medium text-muted hover:text-red-700"
            >
              Delete
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

type Props = {
  listing: Listing;
};

export function ListingComments({ listing }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const sellerId = listing.sellerId || listing.seller.id;
  const loginHref = `/login?next=/listing/${listing.id}#comments`;
  const [comments, setComments] = useState<ListingComment[]>([]);
  const [commentsReady, setCommentsReady] = useState(false);
  const [replyTo, setReplyTo] = useState<{
    rootId: string;
    authorId: string;
    authorName: string;
  } | null>(null);

  useEffect(() => {
    setCommentsReady(false);
    return subscribeListingComments(listing.id, (next) => {
      setComments(next);
      setCommentsReady(true);
    });
  }, [listing.id]);

  const { roots, repliesByParent } = useMemo(
    () => groupComments(comments),
    [comments],
  );

  function requireUser() {
    if (user) return true;
    router.push(loginHref);
    return false;
  }

  function beginReply(rootId: string, authorId: string, authorName: string) {
    if (!requireUser()) return;
    setReplyTo({ rootId, authorId, authorName });
  }

  async function post(text: string, parent?: typeof replyTo) {
    if (!user) throw new Error("Sign in to comment.");
    const body =
      parent && !text.trimStart().startsWith("@")
        ? `@${parent.authorName} ${text}`
        : text;
    await addListingComment({
      listingId: listing.id,
      listingTitle: listing.title,
      sellerId,
      parentId: parent?.rootId || null,
      replyToAuthorId: parent?.authorId || null,
      authorId: user.uid,
      authorName: user.name,
      text: body,
    });
  }

  return (
    <section id="comments" className="scroll-mt-24 space-y-5">
      <div>
        <h2 className="font-display text-xl tracking-tight">
          Comments
          {comments.length ? (
            <span className="ml-2 text-base text-muted">{comments.length}</span>
          ) : null}
        </h2>
        <p className="mt-1 text-sm text-muted">
          Ask a question or leave a note — replies stay on this ad.
        </p>
      </div>

      {user ? (
        <div className="flex gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-xs font-medium text-paper">
            {initials(user.name)}
          </div>
          <div className="min-w-0 flex-1">
            <CommentComposer
              placeholder="Add a public comment…"
              submitLabel="Comment"
              onSubmit={(text) => post(text)}
            />
          </div>
        </div>
      ) : (
        <p className="rounded-2xl bg-canvas px-4 py-3 text-sm text-muted">
          <Link href={loginHref} className="font-medium text-accent">
            Sign in
          </Link>{" "}
          to leave a comment.
        </p>
      )}

      <div className="space-y-6">
        {!commentsReady ? (
          <div className="space-y-4" aria-busy="true" aria-label="Loading comments">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex gap-3">
                <div className="skeleton size-9 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="skeleton h-3 w-32 rounded-full" />
                  <div className="skeleton h-3 w-full rounded-full" />
                  <div className="skeleton h-3 w-2/3 max-w-[70%] rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : roots.length === 0 ? (
          <p className="text-sm text-muted">No comments yet. Start the conversation.</p>
        ) : (
          roots.map((root) => {
            const replies = repliesByParent.get(root.id) || [];
            const replyTarget = replyTo?.rootId === root.id ? replyTo : null;
            return (
              <div key={root.id} className="space-y-1">
                <CommentRow
                  comment={root}
                  isSeller={root.authorId === sellerId}
                  isOwn={user?.uid === root.authorId}
                  onReply={() =>
                    beginReply(root.id, root.authorId, root.authorName)
                  }
                  onDelete={() => {
                    if (!user) return;
                    void deleteListingComment(root, user.uid);
                  }}
                />
                {replies.length || replyTarget ? (
                  <div className="ml-4 border-l border-line pl-4 sm:ml-12 sm:pl-5">
                    {replies.map((reply) => (
                      <CommentRow
                        key={reply.id}
                        comment={reply}
                        isSeller={reply.authorId === sellerId}
                        isOwn={user?.uid === reply.authorId}
                        depth={1}
                        onReply={() =>
                          beginReply(root.id, reply.authorId, reply.authorName)
                        }
                        onDelete={() => {
                          if (!user) return;
                          void deleteListingComment(reply, user.uid);
                        }}
                      />
                    ))}
                    {replyTarget && user ? (
                      <div className="mt-4 flex gap-3">
                        <div className="grid size-8 shrink-0 place-items-center rounded-full bg-ink text-[10px] font-medium text-paper">
                          {initials(user.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <CommentComposer
                            placeholder={`Reply to ${replyTarget.authorName}…`}
                            submitLabel="Reply"
                            autoFocus
                            onCancel={() => setReplyTo(null)}
                            onSubmit={(text) => post(text, replyTarget)}
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
