import { ROUTES } from "@/lib/constants/routes";

/**
 * Every string a person reads on an auth surface lives here.
 *
 * Two reasons it is centralised: page metadata and the visible <h1> must never
 * drift apart, and provider error text must never reach a user. Supabase writes
 * for developers ("Invalid login credentials", "AuthApiError: over_email_send_
 * rate_limit") — at the moment someone is typing a password, that reads as a
 * system that does not know what happened. Every message below names the
 * problem and the way out.
 */

export const AUTH_COPY = {
  login: {
    title: "Sign in",
    description:
      "Your hiring threads, expert shortlists, and payouts are where you left them.",
  },
  signUp: {
    title: "Create account",
    description:
      "One account for your threads, the people you hire, and the money that moves.",
  },
  forgotPassword: {
    title: "Reset your password",
    metaTitle: "Reset password",
    description:
      "Tell us the email on your account and we'll send a link that lets you set a new password.",
  },
  updatePassword: {
    title: "Choose a new password",
    metaTitle: "New password",
    description:
      "This replaces the password on your account. You'll use it the next time you sign in.",
  },
  error: {
    title: "We couldn't sign you in",
    metaTitle: "Sign-in problem",
  },
  notConfigured: {
    title: "Sign-in is offline",
    description:
      "Accounts can’t be checked in this environment right now. Try again later.",
  },
} as const;

/** Password rule the server actually enforces. Stated up front, not after failure. */
export const PASSWORD_MIN_LENGTH = 8;

/* ---------------------------------------------------------------- destinations */

/**
 * A guarded route bounces you to `/auth/login?next=…` and, before this, said
 * nothing about why. We name the destination in plain language — never the raw
 * path, which is untrusted input and unreadable besides.
 */
export function describeDestination(next: string | undefined): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  if (next === ROUTES.main || next.startsWith(`${ROUTES.main}/`)) {
    return "your workspace";
  }
  if (next === ROUTES.internal || next.startsWith(`${ROUTES.internal}/`)) {
    return "internal tools";
  }
  return "the page you asked for";
}

/* ---------------------------------------------------------------- error mapping */

export type AuthErrorContext = "sign-in" | "sign-up" | "reset" | "update" | "callback";

export interface AuthErrorCopy {
  message: string;
  action?: { label: string; href: string };
}

/* Action labels never repeat a phrase from the message they follow — the
 * sentence names the problem, the link names the escape. */
const RESET_ACTION = {
  label: "Send a reset link",
  href: ROUTES.auth.forgotPassword,
};
const SIGN_IN_ACTION = { label: "Go to sign in", href: ROUTES.auth.login };
const NEW_LINK_ACTION = {
  label: "Send a fresh link",
  href: ROUTES.auth.forgotPassword,
};
const CREATE_ACTION = { label: "Create an account", href: ROUTES.auth.signUp };

interface Rule {
  match: RegExp;
  copy: (context: AuthErrorContext) => AuthErrorCopy;
}

const RULES: Rule[] = [
  {
    match: /invalid login credentials|invalid_credentials|invalid grant/,
    copy: () => ({
      message:
        "That email and password don't match an account. Check both for typos.",
      action: RESET_ACTION,
    }),
  },
  {
    match: /email not confirmed|email_not_confirmed/,
    copy: () => ({
      message:
        "This email hasn't been confirmed yet. Open the confirmation link we sent you, then sign in.",
    }),
  },
  {
    match: /already registered|user_already_exists|already been registered/,
    copy: () => ({
      message: "An account already uses this email.",
      action: SIGN_IN_ACTION,
    }),
  },
  {
    match: /unable to validate email|invalid format|email_address_invalid/,
    copy: () => ({
      message:
        "That email address isn't formatted correctly. Check the spelling and try again.",
    }),
  },
  {
    match: /password (should|must) be at least|weak_password|password is too short/,
    copy: () => ({
      message: `That password is too short. Use at least ${PASSWORD_MIN_LENGTH} characters.`,
    }),
  },
  {
    match: /different from the old password|same_password/,
    copy: () => ({
      message:
        "Pick a password you haven't used on this account before, then save again.",
    }),
  },
  {
    match: /passwords do not match/,
    copy: () => ({
      message: "The two passwords don't match. Retype the second one.",
    }),
  },
  {
    match: /for security purposes|rate limit|too many requests|over_email_send_rate_limit|over_request_rate_limit/,
    copy: () => ({
      message:
        "Too many attempts in a short time. Wait about a minute, then try again.",
    }),
  },
  {
    match: /session missing|session_not_found|refresh_token|token has expired|otp_expired|expired|already been used|invalid or has expired|bad_jwt/,
    copy: (context) =>
      context === "update" || context === "callback" || context === "reset"
        ? {
            message:
              "This link has expired or was already used. Links work once, so open the newest email you were sent.",
            action: NEW_LINK_ACTION,
          }
        : {
            message: "Your session expired while you were away.",
            action: SIGN_IN_ACTION,
          },
  },
  {
    match: /signups? not allowed|signup_disabled|email_provider_disabled/,
    copy: () => ({
      message:
        "New accounts aren't open right now. If you were invited, use the address that was invited.",
      action: SIGN_IN_ACTION,
    }),
  },
  {
    match: /email and password are required/,
    copy: () => ({ message: "Enter both your email address and your password." }),
  },
  {
    match: /email is required/,
    copy: () => ({ message: "Enter the email address on your account." }),
  },
  {
    match: /user not found|user_not_found/,
    copy: (context) =>
      context === "reset"
        ? {
            message:
              "We couldn't send a link to that address. Check the spelling first.",
            action: CREATE_ACTION,
          }
        : {
            message: "No account uses that email. Check the spelling first.",
            action: CREATE_ACTION,
          },
  },
  {
    match: /failed to fetch|fetch failed|network|econnrefused|timeout|getaddrinfo/,
    copy: () => ({
      message:
        "We couldn't reach the server. Check your connection, then try again.",
    }),
  },
  {
    match: /not configured/,
    copy: () => ({
      message:
        "Sign-in is offline in this environment — the auth service hasn't been configured yet.",
    }),
  },
];

const FALLBACK: Record<AuthErrorContext, AuthErrorCopy> = {
  "sign-in": {
    message: "We couldn't sign you in just now. Try again in a moment.",
    action: RESET_ACTION,
  },
  "sign-up": {
    message:
      "We couldn't create your account just now. Your details are still here — try again in a moment.",
  },
  reset: {
    message:
      "We couldn't send the reset link just now. Check the address and try again in a moment.",
  },
  update: {
    message: "We couldn't save your new password just now. Try again in a moment.",
    action: NEW_LINK_ACTION,
  },
  callback: {
    message:
      "The link may have expired or already been used. Nothing was changed on your account.",
    action: SIGN_IN_ACTION,
  },
};

/** Turns any raw provider or action error into copy a person can act on. */
export function mapAuthError(
  raw: string | undefined,
  context: AuthErrorContext,
): AuthErrorCopy {
  if (!raw) return FALLBACK[context];
  const normalized = raw.toLowerCase();
  const rule = RULES.find((candidate) => candidate.match.test(normalized));
  return rule ? rule.copy(context) : FALLBACK[context];
}
