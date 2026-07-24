import { PASSWORD_MIN_LENGTH } from "./auth-copy";

/**
 * Client-side guards. They run on blur so a mistake is named while the field is
 * still the thing you are looking at, rather than after a round trip that used
 * to arrive with the form emptied.
 *
 * The server actions re-validate everything; nothing here is a security control.
 */

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmail(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return "Enter the email address on your account.";
  if (!EMAIL_SHAPE.test(trimmed)) {
    return "That doesn't look like an email address — check for a missing @ or domain.";
  }
  return undefined;
}

export function validateCurrentPassword(value: string): string | undefined {
  if (!value) return "Enter your password.";
  return undefined;
}

export function validateNewPassword(value: string): string | undefined {
  if (!value) return "Choose a password.";
  if (value.length < PASSWORD_MIN_LENGTH) {
    const short = PASSWORD_MIN_LENGTH - value.length;
    return `${PASSWORD_MIN_LENGTH} characters minimum — ${short} more to go.`;
  }
  return undefined;
}

export function validateConfirmation(
  password: string,
  confirmation: string,
): string | undefined {
  if (!confirmation) return "Retype the password to confirm it.";
  if (password !== confirmation) {
    return "The two passwords don't match. Retype this one.";
  }
  return undefined;
}

export interface PasswordStrength {
  /** 0–4. 0 means the password is still below the enforced minimum. */
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  hint: string;
}

/**
 * Advisory only — length is the single hard rule, and it is stated before
 * typing starts. The meter says how much margin you have beyond it.
 */
export function passwordStrength(value: string): PasswordStrength {
  if (value.length < PASSWORD_MIN_LENGTH) {
    return {
      score: 0,
      label: "Too short",
      hint: `${PASSWORD_MIN_LENGTH - value.length} more character${
        PASSWORD_MIN_LENGTH - value.length === 1 ? "" : "s"
      } needed.`,
    };
  }

  const hasNumberOrSymbol = /[^A-Za-z]/.test(value);
  const hasMixedCase = /[a-z]/.test(value) && /[A-Z]/.test(value);
  const points =
    (value.length >= 12 ? 1 : 0) +
    (value.length >= 16 ? 1 : 0) +
    (hasNumberOrSymbol ? 1 : 0) +
    (hasMixedCase ? 1 : 0);

  const score = Math.min(4, 1 + points) as 1 | 2 | 3 | 4;
  const label = (["Weak", "Fair", "Good", "Strong"] as const)[score - 1];

  let hint = "Long enough to save.";
  if (value.length < 12) hint = "Length beats complexity — try 12 or more characters.";
  else if (!hasNumberOrSymbol) hint = "Add a number or symbol to strengthen it.";
  else if (!hasMixedCase) hint = "Mix upper and lower case to strengthen it.";
  else if (score === 4) hint = "Strong enough for an account that moves money.";

  return { score, label, hint };
}
