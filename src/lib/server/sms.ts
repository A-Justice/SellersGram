export type SmsSendResult = {
  ok: boolean;
  skipped?: boolean;
  error?: string;
};

/** Same shape as Stallkeeper.Pos.Core.Sms → MNotify `sms/quick`. */
function mnotifyConfigured() {
  return Boolean(process.env.MNOTIFY_API_KEY);
}

/**
 * Format like Stallkeeper SmsServiceBase.FormatPhoneNumber:
 * Ghana local (0XXXXXXXXX) → +233XXXXXXXXX; leave other E.164 as-is.
 */
function formatPhoneNumber(phoneNumber: string) {
  const trimmed = phoneNumber.trim();
  if (!trimmed) return trimmed;

  let cleaned = [...trimmed].filter((c) => /\d/.test(c) || c === "+").join("");

  if (cleaned.startsWith("233") && cleaned.length === 12) {
    cleaned = `+${cleaned}`;
  } else if (cleaned.startsWith("0") && cleaned.length === 10) {
    cleaned = `+233${cleaned.slice(1)}`;
  }

  return cleaned;
}

/**
 * Send a transactional SMS via mNotify (same provider as Stallkeeper POS).
 * Skips if `MNOTIFY_API_KEY` is not set.
 */
export async function sendSms(to: string, content: string): Promise<SmsSendResult> {
  const apiKey = process.env.MNOTIFY_API_KEY;
  if (!apiKey) {
    return { ok: true, skipped: true, error: "mNotify SMS is not configured." };
  }

  const recipient = formatPhoneNumber(to);
  if (!recipient) {
    return { ok: false, error: "Missing phone number." };
  }

  const sender = (process.env.MNOTIFY_SENDER_ID || "VendorsGram").trim() || "VendorsGram";

  const response = await fetch("https://api.mnotify.com/api/sms/quick", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      key: apiKey,
      recipient: [recipient],
      sender,
      message: content,
      is_schedule: "false",
      schedule_date: "",
    }),
  });

  const body = await response.text().catch(() => "");
  if (!response.ok) {
    return {
      ok: false,
      error: `mNotify ${response.status}: ${body.slice(0, 300)}`,
    };
  }

  // mNotify often returns HTTP 200 with a JSON status field on failure.
  try {
    const parsed = JSON.parse(body) as { status?: string | number; message?: string };
    const status = String(parsed.status ?? "").toLowerCase();
    if (status && status !== "success" && status !== "ok" && status !== "200") {
      return {
        ok: false,
        error: `mNotify: ${parsed.message || body.slice(0, 300)}`,
      };
    }
  } catch {
    // Non-JSON success body — treat HTTP success as ok.
  }

  return { ok: true };
}

export function smsReady() {
  return mnotifyConfigured();
}
