import { NextResponse } from "next/server";
import { publicEnv, isDefaultFirestoreDatabase } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Safe diagnostics for confirming which Firestore DB this backend is using. */
export async function GET() {
  const database = publicEnv.firestoreDatabase;
  return NextResponse.json({
    firestoreDatabase: database,
    usingDefaultDatabase: isDefaultFirestoreDatabase(database),
    appUrl: publicEnv.appUrl,
    projectId: publicEnv.firebaseProjectId,
  });
}
