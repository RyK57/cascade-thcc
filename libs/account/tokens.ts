import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

/**
 * Raw credentials never touch the database. Everything is stored as a sha256
 * digest, so a leaked table dump cannot be replayed as a login. sha256 (not a
 * password KDF) is the right tool here: these are 256-bit random tokens and
 * short-lived codes, not human-chosen secrets.
 */
export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/** Codes are only 6 digits, so bind the hash to the phone it was issued for. */
export function hashCode(phone: string, code: string): string {
  return createHash("sha256")
    .update(`${normalizePhone(phone)}:${code.trim()}`)
    .digest("hex");
}

export function generateLinkToken(): string {
  return randomBytes(32).toString("base64url");
}

export function generateOtpCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/** Constant-time compare so a wrong code leaks no prefix information. */
export function hashesMatch(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/**
 * iMessage handles are phone numbers or Apple IDs. Compare them the way Linq
 * delivers them, minus formatting noise, so "+1 (512) 226-3512" and
 * "+15122263512" are the same account.
 */
export function normalizePhone(handle: string): string {
  const trimmed = handle.trim();
  if (trimmed.includes("@")) return trimmed.toLowerCase();
  const digits = trimmed.replace(/[^\d+]/g, "");
  return digits.startsWith("+") ? digits : `+${digits}`;
}

export function samePhone(a: string, b: string): boolean {
  return normalizePhone(a) === normalizePhone(b);
}
