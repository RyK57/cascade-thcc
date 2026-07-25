import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * End-to-end sign-in through the real route handlers: request a code, exchange
 * it for a session cookie, then read the account back. The database is an
 * in-memory store that mirrors the semantics verified directly against Postgres
 * (single-use consumption, expiry, attempt cap), so what is under test here is
 * the wiring — hashing, cookies, redirects and phone scoping.
 */

interface StoredLink {
  id: string;
  phone: string;
  userId?: string;
  jobId?: string;
  purpose: string;
  tokenHash: string;
  codeHash?: string;
  expiresAt: Date;
  consumedAt?: Date;
  attempts: number;
  createdAt: string;
}

interface StoredSession {
  id: string;
  userId: string;
  phone: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt?: Date;
}

const links: StoredLink[] = [];
const sessions: StoredSession[] = [];
const cookieJar = new Map<string, string>();
const sentMessages: { chatId: string; text: string }[] = [];
const sentTexts: { from: string; to: string[]; text: string }[] = [];
/** Every outbound in send order, whichever channel carried it. */
const outbound: { text: string }[] = [];

let jobForHandle: { linqChatId: string } | null = { linqChatId: "chat_1" };

const MAX_CODE_ATTEMPTS = 5;
const USER_ID = "44444444-4444-4444-8444-444444444444";

vi.mock("@/db/accounts", () => ({
  // Literal, not the const above: vi.mock factories are hoisted above it.
  MAX_CODE_ATTEMPTS: 5,
  createAccountLink: vi.fn(async (input: Record<string, never>) => {
    const row = {
      id: `link_${links.length + 1}`,
      attempts: 0,
      createdAt: new Date().toISOString(),
      ...input,
    } as unknown as StoredLink;
    links.push(row);
    return row;
  }),
  // Compare-and-set: only an unconsumed, unexpired row comes back.
  consumeAccountLink: vi.fn(async (tokenHash: string) => {
    const row = links.find(
      (l) =>
        l.tokenHash === tokenHash && !l.consumedAt && l.expiresAt > new Date()
    );
    if (!row) return null;
    row.consumedAt = new Date();
    return row;
  }),
  consumeAccountLinkById: vi.fn(async (id: string) => {
    const row = links.find((l) => l.id === id && !l.consumedAt);
    if (!row) return false;
    row.consumedAt = new Date();
    return true;
  }),
  findLiveAccountLinkByPhone: vi.fn(async (phone: string) => {
    const row = [...links]
      .reverse()
      .find(
        (l) =>
          l.phone === phone &&
          !l.consumedAt &&
          l.expiresAt > new Date() &&
          l.attempts < MAX_CODE_ATTEMPTS
      );
    return row ? { link: row, codeHash: row.codeHash ?? null } : null;
  }),
  recordCodeAttempt: vi.fn(async (id: string) => {
    const row = links.find((l) => l.id === id);
    if (row) row.attempts += 1;
  }),
  createAccountSession: vi.fn(async (input: Omit<StoredSession, "id">) => {
    const row = { id: `sess_${sessions.length + 1}`, ...input };
    sessions.push(row);
    return { ...row, expiresAt: row.expiresAt.toISOString() };
  }),
  getAccountSessionByTokenHash: vi.fn(async (tokenHash: string) => {
    const row = sessions.find(
      (s) =>
        s.tokenHash === tokenHash && !s.revokedAt && s.expiresAt > new Date()
    );
    return row ? { ...row, expiresAt: row.expiresAt.toISOString() } : null;
  }),
  revokeAccountSession: vi.fn(async (tokenHash: string) => {
    const row = sessions.find((s) => s.tokenHash === tokenHash);
    if (row) row.revokedAt = new Date();
  }),
}));

const verifiedPhones = new Set<string>();

vi.mock("@/db/users", () => ({
  upsertUserByPhone: vi.fn(async ({ phone }: { phone: string }) => ({
    id: USER_ID,
    phone,
  })),
  getUserByPhone: vi.fn(async (phone: string) => ({
    id: USER_ID,
    phone,
    walletAddress: "0x1111111111111111111111111111111111111111",
    creditBalance: 0,
  })),
  markPhoneVerified: vi.fn(async (userId: string) => {
    verifiedPhones.add(userId);
    return { id: userId };
  }),
}));

vi.mock("@/db/jobs", () => ({
  getLatestJobByHandle: vi.fn(async () => jobForHandle),
}));

vi.mock("@/libs/linq", () => ({
  isLinqConfigured: vi.fn(() => true),
  getLinqFromNumber: vi.fn(() => "+15550004242"),
  sendChatMessage: vi.fn(async (params: { chatId: string; text: string }) => {
    sentMessages.push(params);
    outbound.push(params);
    return { message: { id: "msg_1" } };
  }),
  sendTextMessage: vi.fn(
    async (params: { from: string; to: string[]; text: string }) => {
      sentTexts.push(params);
      outbound.push(params);
      return { id: "chat_new" };
    }
  ),
}));

vi.mock("@/utils/supabase/admin", () => ({
  isSupabaseAdminConfigured: vi.fn(() => true),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      cookieJar.has(name) ? { name, value: cookieJar.get(name) } : undefined,
    set: (name: string, value: string) => cookieJar.set(name, value),
    delete: (name: string) => cookieJar.delete(name),
  }),
}));

import { POST as requestCodeRoute } from "@/app/api/account/code/route";
import { GET as sessionRoute } from "@/app/api/account/session/route";
import { POST as verifyRoute } from "@/app/api/account/verify/route";
import { GET as magicLinkRoute } from "@/app/l/[token]/route";
import { ACCOUNT_SESSION_COOKIE } from "@/libs/account/constants";

const PHONE = "+15122263512";
const OTHER_PHONE = "+15129377003";

function postJson(url: string, body: unknown): Request {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** Pull the code out of the message Cascade actually texted. */
function textedCode(): string {
  const match = outbound.at(-1)?.text.match(/(\d{6})/);
  return match?.[1] ?? "";
}

function textedToken(): string {
  const match = outbound.at(-1)?.text.match(/\/l\/([A-Za-z0-9_-]+)/);
  return match?.[1] ?? "";
}

beforeEach(() => {
  links.length = 0;
  sessions.length = 0;
  sentMessages.length = 0;
  sentTexts.length = 0;
  outbound.length = 0;
  cookieJar.clear();
  verifiedPhones.clear();
  jobForHandle = { linqChatId: "chat_1" };
  process.env.NEXT_PUBLIC_SITE_URL = "https://cascade.test";
});

describe("phone sign-in, end to end", () => {
  it("texts a code, exchanges it for a session, and reports the account", async () => {
    const requested = await requestCodeRoute(
      postJson("https://cascade.test/api/account/code", { phone: PHONE })
    );
    expect(requested.status).toBe(200);
    expect(sentMessages).toHaveLength(1);
    expect(sentMessages[0].chatId).toBe("chat_1");

    const verified = await verifyRoute(
      postJson("https://cascade.test/api/account/verify", {
        phone: PHONE,
        code: textedCode(),
      })
    );
    expect(verified.status).toBe(200);
    expect(await verified.json()).toEqual({ ok: true, next: "/main" });

    // The cookie is the whole session; nothing about the phone is in the URL.
    expect(cookieJar.has(ACCOUNT_SESSION_COOKIE)).toBe(true);

    const me = await sessionRoute();
    expect(await me.json()).toMatchObject({ signedIn: true, phone: PHONE });

    // The account is now verified, which is what unlocks the agent.
    expect(verifiedPhones.has(USER_ID)).toBe(true);

    // First verification: the agent says hello in the same thread.
    expect(sentMessages).toHaveLength(2);
    expect(sentMessages[1].text).toContain("I'm Cascade");
  });

  it("leaves the phone unverified when the code is never redeemed", async () => {
    await requestCodeRoute(
      postJson("https://cascade.test/api/account/code", { phone: PHONE })
    );

    expect(verifiedPhones.size).toBe(0);
  });

  it("never stores the raw code or token", async () => {
    await requestCodeRoute(
      postJson("https://cascade.test/api/account/code", { phone: PHONE })
    );

    const stored = JSON.stringify(links[0]);
    expect(stored).not.toContain(textedCode());
    expect(stored).not.toContain(textedToken());
  });

  it("rejects a wrong code and issues no session", async () => {
    await requestCodeRoute(
      postJson("https://cascade.test/api/account/code", { phone: PHONE })
    );

    const response = await verifyRoute(
      postJson("https://cascade.test/api/account/verify", {
        phone: PHONE,
        code: textedCode() === "000000" ? "111111" : "000000",
      })
    );

    expect(response.status).toBe(401);
    expect(cookieJar.has(ACCOUNT_SESSION_COOKIE)).toBe(false);
    expect(sessions).toHaveLength(0);
  });

  it("stops accepting a code after five wrong guesses", async () => {
    await requestCodeRoute(
      postJson("https://cascade.test/api/account/code", { phone: PHONE })
    );
    const realCode = textedCode();
    const wrong = realCode === "000000" ? "111111" : "000000";

    for (let i = 0; i < 5; i += 1) {
      await verifyRoute(
        postJson("https://cascade.test/api/account/verify", {
          phone: PHONE,
          code: wrong,
        })
      );
    }

    // Even the correct code is dead once the challenge is retired.
    const response = await verifyRoute(
      postJson("https://cascade.test/api/account/verify", {
        phone: PHONE,
        code: realCode,
      })
    );
    expect(response.status).toBe(401);
    expect(sessions).toHaveLength(0);
  });

  it("signs up a brand-new number: first code, then the intro", async () => {
    // The user's exact web flow: type a fresh number on the site, get the
    // code in a new chat, verify — and the agent introduces itself there.
    jobForHandle = null;

    const requested = await requestCodeRoute(
      postJson("https://cascade.test/api/account/code", {
        phone: "+15550001111",
      })
    );
    expect(requested.status).toBe(200);
    expect(sentTexts).toHaveLength(1);
    expect(sentTexts[0].to).toEqual(["+15550001111"]);
    expect(links).toHaveLength(1);

    const verified = await verifyRoute(
      postJson("https://cascade.test/api/account/verify", {
        phone: "+15550001111",
        code: textedCode(),
      })
    );
    expect(verified.status).toBe(200);
    expect(verifiedPhones.has(USER_ID)).toBe(true);

    expect(sentTexts).toHaveLength(2);
    expect(sentTexts[1].to).toEqual(["+15550001111"]);
    expect(sentTexts[1].text).toContain("I'm Cascade");
    expect(sentTexts[1].text).toMatch(/\?/);
  });
});

describe("magic link landing", () => {
  it("signs the phone in and lands on their account", async () => {
    await requestCodeRoute(
      postJson("https://cascade.test/api/account/code", { phone: PHONE })
    );

    const response = await magicLinkRoute(
      new Request(`https://cascade.test/l/${textedToken()}`),
      { params: Promise.resolve({ token: textedToken() }) }
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://cascade.test/main");
    expect(cookieJar.has(ACCOUNT_SESSION_COOKIE)).toBe(true);
  });

  it("sends a replayed link back to sign-in instead of minting a session", async () => {
    await requestCodeRoute(
      postJson("https://cascade.test/api/account/code", { phone: PHONE })
    );
    const token = textedToken();
    const context = { params: Promise.resolve({ token }) };

    await magicLinkRoute(new Request(`https://cascade.test/l/${token}`), context);
    cookieJar.clear();

    const replay = await magicLinkRoute(
      new Request(`https://cascade.test/l/${token}`),
      { params: Promise.resolve({ token }) }
    );

    expect(replay.headers.get("location")).toBe(
      "https://cascade.test/auth/phone?expired=1"
    );
    expect(cookieJar.has(ACCOUNT_SESSION_COOKIE)).toBe(false);
    expect(sessions).toHaveLength(1);
  });
});

describe("session scoping", () => {
  it("reports the phone that signed in, not whoever asked last", async () => {
    await requestCodeRoute(
      postJson("https://cascade.test/api/account/code", { phone: PHONE })
    );
    await verifyRoute(
      postJson("https://cascade.test/api/account/verify", {
        phone: PHONE,
        code: textedCode(),
      })
    );

    // A second person requesting a code must not move the live session.
    await requestCodeRoute(
      postJson("https://cascade.test/api/account/code", { phone: OTHER_PHONE })
    );

    const me = await sessionRoute();
    expect(await me.json()).toMatchObject({ phone: PHONE });
  });

  it("reports signed out when there is no cookie", async () => {
    const me = await sessionRoute();
    expect(await me.json()).toEqual({ signedIn: false });
  });
});
