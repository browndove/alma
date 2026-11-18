/**
 * Ghana phone numbers: national format is 0 + 9 digits (e.g. 024 123 4567),
 * international is +233 + the same 9 digits. We accept either (with spaces,
 * dashes or brackets) and store the national form.
 *
 * Only mobile ranges are accepted — riders call or WhatsApp the number and
 * Paystack MoMo needs a mobile line. Prefixes are the NCA-allocated ranges for
 * MTN, Telecel, AirtelTigo and Glo (numbers may be ported between networks).
 */
const GHANA_MOBILE_PREFIXES = [
  "20", // Telecel
  "23", // Glo
  "24", // MTN
  "25", // MTN
  "26", // AirtelTigo
  "27", // AirtelTigo
  "50", // Telecel
  "53", // MTN
  "54", // MTN
  "55", // MTN
  "56", // AirtelTigo
  "57", // AirtelTigo
  "59", // MTN
] as const

/** The 9 digits after the trunk 0 / +233, or null if the shape is wrong. */
function subscriberDigits(raw: string): string | null {
  const digits = raw.replace(/\D/g, "")
  if (digits.length === 12 && digits.startsWith("233")) return digits.slice(3)
  if (digits.length === 13 && digits.startsWith("2330")) return digits.slice(4)
  if (digits.length === 10 && digits.startsWith("0")) return digits.slice(1)
  if (digits.length === 9 && !digits.startsWith("0")) return digits
  return null
}

/** Normalised national form ("0241234567"), or null if it isn't a Ghana mobile number. */
export function normalizeGhanaPhone(raw: string): string | null {
  const subscriber = subscriberDigits(raw)
  if (!subscriber) return null
  const prefix = subscriber.slice(0, 2)
  if (!(GHANA_MOBILE_PREFIXES as readonly string[]).includes(prefix)) return null
  return `0${subscriber}`
}

/** A friendly message explaining what's wrong, or null when the number is valid. */
export function ghanaPhoneError(raw: string): string | null {
  const value = raw.trim()
  if (!value) return "Enter a phone number"
  const digits = value.replace(/\D/g, "")
  if (/[^\d\s()+-]/.test(value)) return "Use digits only, e.g. 024 123 4567"
  if (digits.startsWith("233") || value.startsWith("+")) {
    if (!digits.startsWith("233")) return "Only Ghana numbers (+233) are supported"
  }
  const subscriber = subscriberDigits(value)
  if (!subscriber) {
    return digits.length < 10
      ? "Ghana numbers have 10 digits, e.g. 024 123 4567"
      : "That’s too many digits — Ghana numbers look like 024 123 4567"
  }
  if (!normalizeGhanaPhone(value)) {
    return "Enter a Ghana mobile number — it starts with 024, 054, 055, 020, 050, 027, 026…"
  }
  return null
}

/** "0241234567" → "024 123 4567" for display. */
export function formatGhanaPhone(national: string) {
  const digits = national.replace(/\D/g, "")
  if (digits.length !== 10) return national
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
}
