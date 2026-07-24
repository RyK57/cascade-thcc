/** Lightweight in-process sandbox counters (reset on process restart). */

const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
const MAX_MESSAGES_PER_DAY = 100;
const MAX_PER_RECIPIENT_PER_MINUTE = 30;

let dayStartedAt = Date.now();
let dayCount = 0;
const recipientBuckets = new Map<string, { windowStartedAt: number; count: number }>();

function rollDay() {
  if (Date.now() - dayStartedAt >= DAY_MS) {
    dayStartedAt = Date.now();
    dayCount = 0;
  }
}

export function remainingDailyMessages(): number {
  rollDay();
  return Math.max(0, MAX_MESSAGES_PER_DAY - dayCount);
}

export function noteOutboundSend(recipientKey?: string): {
  allowed: boolean;
  remainingToday: number;
  retryAfterMs?: number;
} {
  rollDay();
  if (dayCount >= MAX_MESSAGES_PER_DAY) {
    console.warn(
      `[linq] daily sandbox cap reached (${MAX_MESSAGES_PER_DAY}). remaining=0`
    );
    return { allowed: false, remainingToday: 0 };
  }

  if (recipientKey) {
    const now = Date.now();
    const bucket = recipientBuckets.get(recipientKey) ?? {
      windowStartedAt: now,
      count: 0,
    };
    if (now - bucket.windowStartedAt >= MINUTE_MS) {
      bucket.windowStartedAt = now;
      bucket.count = 0;
    }
    if (bucket.count >= MAX_PER_RECIPIENT_PER_MINUTE) {
      const retryAfterMs = MINUTE_MS - (now - bucket.windowStartedAt);
      console.warn(
        `[linq] per-recipient rate limit for ${recipientKey}; retry_after_ms=${retryAfterMs}`
      );
      return {
        allowed: false,
        remainingToday: MAX_MESSAGES_PER_DAY - dayCount,
        retryAfterMs,
      };
    }
    bucket.count += 1;
    recipientBuckets.set(recipientKey, bucket);
  }

  dayCount += 1;
  const remainingToday = MAX_MESSAGES_PER_DAY - dayCount;
  if (remainingToday <= 10) {
    console.info(`[linq] sandbox messages remaining today: ${remainingToday}`);
  }
  return { allowed: true, remainingToday };
}

export async function withRetryAfter<T>(
  fn: () => Promise<T>,
  recipientKey?: string
): Promise<T> {
  const gate = noteOutboundSend(recipientKey);
  if (!gate.allowed) {
    if (gate.retryAfterMs) {
      await new Promise((r) =>
        setTimeout(r, Math.min(gate.retryAfterMs ?? 2_000, 5_000))
      );
      return withRetryAfter(fn, recipientKey);
    }
    throw new Error("Linq sandbox daily message cap reached");
  }

  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const match = message.match(/retry_after["\s:]*(\d+)/i);
    if (message.includes("429") || match) {
      const seconds = match ? Number(match[1]) : 2;
      console.warn(`[linq] 429 received; sleeping ${seconds}s`);
      await new Promise((r) => setTimeout(r, seconds * 1000));
      return fn();
    }
    throw error;
  }
}
