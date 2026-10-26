export const OWNER_UID = "DSOWYy2niQZZtgkuogN2StnryTW2";

/** Synthetic inbox identity for moderation messages — not a real auth user / profile. */
export const ADMIN_SYSTEM_UID = "vg-system-admin";
export const ADMIN_DISPLAY_NAME = "Admin";

export function isOwnerUid(uid: string | null | undefined) {
  return uid === OWNER_UID;
}

export function isAdminSystemUid(uid: string | null | undefined) {
  return uid === ADMIN_SYSTEM_UID;
}

export function adminModerationThreadId(listingId: string) {
  return `admin-${listingId}`;
}
