"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AccountPageTitle } from "@/components/AccountShell";
import { DeviceAlertsCard } from "@/components/DeviceAlertsCard";
import { InstallAppCard } from "@/components/InstallAppCard";
import { PageSkeleton } from "@/components/PageSkeleton";
import { useAuth } from "@/context/AuthContext";
import { authErrorMessage } from "@/lib/auth-errors";
import { formatPhoneDisplay } from "@/lib/phone";

function AccountContent() {
  const { user, updateAccountProfile } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "";
  const forceEdit = next === "/sell";
  const [editing, setEditing] = useState(forceEdit);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    setName(user.name || "");
    setPhone(user.phone ? formatPhoneDisplay(user.phone) : "");
    setEmail(user.email || "");
    setInstagram(user.instagram || "");
  }, [user]);

  useEffect(() => {
    if (forceEdit) setEditing(true);
  }, [forceEdit]);

  function startEditing() {
    setError("");
    setMessage("");
    setEditing(true);
  }

  function cancelEditing() {
    if (!user) return;
    setName(user.name || "");
    setPhone(user.phone ? formatPhoneDisplay(user.phone) : "");
    setEmail(user.email || "");
    setInstagram(user.instagram || "");
    setError("");
    setMessage("");
    setEditing(false);
  }

  async function onSave(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    setError("");
    setMessage("");
    setBusy(true);
    try {
      await updateAccountProfile({ name, phone, email, instagram });
      if (next.startsWith("/")) {
        router.push(next);
        return;
      }
      setMessage("Profile saved.");
      setEditing(false);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (!user) return <PageSkeleton />;

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
      <div className="mx-auto w-full max-w-lg shrink-0 px-4 lg:px-6">
        <AccountPageTitle
          title="Profile"
          subtitle={<p className="text-sm capitalize text-muted">{user.role}</p>}
        />
        {forceEdit ? (
          <p className="pb-4 text-sm text-muted">
            Add your phone, save, and we’ll take you back to finish your ad.
          </p>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-6">
        <div className="mx-auto max-w-lg space-y-6 px-4 lg:px-6">
          <form
            onSubmit={onSave}
            className="space-y-3 rounded-[28px] bg-paper p-6 shadow-[0_0_0_1px_var(--color-line)]"
          >
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Name or shop
              </span>
              <input
                className="field disabled:opacity-70"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name or shop name"
                required
                minLength={2}
                disabled={!editing}
                readOnly={!editing}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Phone
              </span>
              <input
                className="field disabled:opacity-70"
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="0244123456"
                required={forceEdit}
                disabled={!editing}
                readOnly={!editing}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Email
              </span>
              <input
                className="field disabled:opacity-70"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@email.com"
                disabled={!editing}
                readOnly={!editing}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Instagram
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted">@</span>
                <input
                  className="field min-w-0 flex-1 disabled:opacity-70"
                  value={instagram}
                  onChange={(event) => setInstagram(event.target.value.replace(/^@/, ""))}
                  placeholder="yourshop"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  disabled={!editing}
                  readOnly={!editing}
                />
              </div>
            </label>
            {error ? <p className="text-sm text-red-700">{error}</p> : null}
            {message ? <p className="text-sm text-accent-dark">{message}</p> : null}
            {editing ? (
              <div className="flex gap-2">
                {!forceEdit ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={cancelEditing}
                    className="h-12 flex-1 rounded-full bg-canvas text-sm font-medium disabled:opacity-40"
                  >
                    Cancel
                  </button>
                ) : null}
                <button
                  type="submit"
                  disabled={busy}
                  className="h-12 flex-1 rounded-full bg-ink text-sm font-medium text-paper disabled:opacity-40"
                >
                  {busy
                    ? "Saving…"
                    : forceEdit
                      ? "Save & continue posting"
                      : "Save profile"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={startEditing}
                className="h-12 w-full rounded-full bg-ink text-sm font-medium text-paper"
              >
                Edit
              </button>
            )}
          </form>

          <InstallAppCard />
          <DeviceAlertsCard />
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AccountContent />
    </Suspense>
  );
}
