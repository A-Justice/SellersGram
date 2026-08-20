import { isDefaultFirestoreDatabase, publicEnv } from "@/lib/env";

/** Visible only when this deploy is pointed at the named `test` Firestore DB. */
export function EnvBanner() {
  if (isDefaultFirestoreDatabase()) return null;

  return (
    <div className="bg-ink px-4 py-1.5 text-center text-xs font-medium tracking-wide text-paper">
      TEST ENVIRONMENT · Firestore DB “{publicEnv.firestoreDatabase}” · not production data
    </div>
  );
}
