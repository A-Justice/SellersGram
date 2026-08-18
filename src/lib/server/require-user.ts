export async function requireUser(request: Request) {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) {
    throw new Error("Not signed in");
  }

  const key = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!key) throw new Error("Firebase is not configured.");

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: token }),
    },
  );
  const data = (await response.json()) as {
    users?: Array<{ localId?: string; email?: string }>;
    error?: { message?: string };
  };

  const uid = data.users?.[0]?.localId;
  if (!uid) {
    throw new Error(data.error?.message || "Invalid session");
  }

  return { uid, email: data.users?.[0]?.email || "", token };
}
