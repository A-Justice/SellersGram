/** Normalize Ghana (and E.164) numbers for Firebase phone auth. */
export function toE164Phone(input: string, defaultCountry = "GH"): string {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Enter a phone number.");

  const digits = trimmed.replace(/\D/g, "");
  if (!digits) throw new Error("Enter a valid phone number.");

  if (trimmed.startsWith("+") && digits.length >= 10 && digits.length <= 15) {
    return `+${digits}`;
  }

  if (defaultCountry === "GH") {
    // 0244123456 or 244123456 → +233244123456
    if (digits.startsWith("233") && digits.length === 12) return `+${digits}`;
    if (digits.startsWith("0") && digits.length === 10) {
      return `+233${digits.slice(1)}`;
    }
    if (digits.length === 9) return `+233${digits}`;
  }

  if (digits.length >= 10 && digits.length <= 15) return `+${digits}`;

  throw new Error("Use a full number, e.g. 0244123456 or +233244123456.");
}

export function formatPhoneDisplay(e164: string) {
  if (e164.startsWith("+233") && e164.length === 13) {
    return `0${e164.slice(4)}`;
  }
  return e164;
}
