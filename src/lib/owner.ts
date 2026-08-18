export const OWNER_UID = "DSOWYy2niQZZtgkuogN2StnryTW2";

export function isOwnerUid(uid: string | null | undefined) {
  return uid === OWNER_UID;
}
