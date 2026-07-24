import { beforeEach, describe, expect, it, vi } from "vitest";

const consumeAccountLink = vi.fn();
const consumeAccountLinkById = vi.fn();
const findLiveAccountLinkByPhone = vi.fn();
const recordCodeAttempt = vi.fn();
const upsertUserByPhone = vi.fn();
const markPhoneVerified = vi.fn();

vi.mock("@/db/accounts", () => ({
  consumeAccountLink: (...args: unknown[]) => consumeAccountLink(...args),
  consumeAccountLinkById: (...args: unknown[]) =>
    consumeAccountLinkById(...args),
  findLiveAccountLinkByPhone: (...args: unknown[]) =>
    findLiveAccountLinkByPhone(...args),
  recordCodeAttempt: (...args: unknown[]) => recordCodeAttempt(...args),
}));

vi.mock("@/db/users", () => ({
  upsertUserByPhone: (...args: unknown[]) => upsertUserByPhone(...args),
  markPhoneVerified: (...args: unknown[]) => markPhoneVerified(...args),
}));

import { hashCode, hashToken } from "@/libs/account/tokens";
import {
  VERIFY_CODE_ERROR,
  verifyLinkToken,
  verifyPhoneCode,
} from "@/libs/account/verify";

const PHONE = "+15122263512";
const USER_ID = "44444444-4444-4444-8444-444444444444";
const JOB_ID = "55555555-5555-4555-8555-555555555555";

function link(overrides: Record<string, unknown> = {}) {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    phone: PHONE,
    userId: USER_ID,
    purpose: "link",
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    attempts: 0,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  consumeAccountLinkById.mockResolvedValue(true);
  recordCodeAttempt.mockResolvedValue(undefined);
  upsertUserByPhone.mockResolvedValue({ id: USER_ID });
  markPhoneVerified.mockResolvedValue({ id: USER_ID });
});

describe("verifyLinkToken", () => {
  it("burns the token and returns the phone it was issued for", async () => {
    consumeAccountLink.mockResolvedValue(link({ jobId: JOB_ID }));

    const result = await verifyLinkToken("raw-token");

    expect(consumeAccountLink).toHaveBeenCalledWith(hashToken("raw-token"));
    expect(result).toEqual({ phone: PHONE, userId: USER_ID, jobId: JOB_ID });
    // Redeeming the link is the only thing that marks a number verified.
    expect(markPhoneVerified).toHaveBeenCalledWith(USER_ID);
  });

  it("does not mark a phone verified when the token is rejected", async () => {
    consumeAccountLink.mockResolvedValue(null);

    await verifyLinkToken("raw-token");

    expect(markPhoneVerified).not.toHaveBeenCalled();
  });

  it("rejects a token that was already used or expired", async () => {
    // The DB update is the compare-and-set: no row back means no login.
    consumeAccountLink.mockResolvedValue(null);

    expect(await verifyLinkToken("raw-token")).toBeNull();
  });

  it("rejects an empty token without touching the database", async () => {
    expect(await verifyLinkToken("   ")).toBeNull();
    expect(consumeAccountLink).not.toHaveBeenCalled();
  });
});

describe("verifyPhoneCode", () => {
  it("signs in when the code matches the live challenge", async () => {
    findLiveAccountLinkByPhone.mockResolvedValue({
      link: link({ jobId: JOB_ID }),
      codeHash: hashCode(PHONE, "123456"),
    });

    const result = await verifyPhoneCode({ phone: PHONE, code: "123456" });

    expect(result).toEqual({
      ok: true,
      challenge: { phone: PHONE, userId: USER_ID, jobId: JOB_ID },
    });
    expect(consumeAccountLinkById).toHaveBeenCalled();
  });

  it("burns an attempt instead of the challenge on a wrong code", async () => {
    findLiveAccountLinkByPhone.mockResolvedValue({
      link: link(),
      codeHash: hashCode(PHONE, "123456"),
    });

    const result = await verifyPhoneCode({ phone: PHONE, code: "000000" });

    expect(result).toEqual({ ok: false, error: VERIFY_CODE_ERROR.wrongCode });
    expect(recordCodeAttempt).toHaveBeenCalled();
    expect(consumeAccountLinkById).not.toHaveBeenCalled();
  });

  it("reports no challenge when nothing live exists for the phone", async () => {
    findLiveAccountLinkByPhone.mockResolvedValue(null);

    expect(await verifyPhoneCode({ phone: PHONE, code: "123456" })).toEqual({
      ok: false,
      error: VERIFY_CODE_ERROR.noChallenge,
    });
  });

  it("loses a race for the same code rather than minting two sessions", async () => {
    findLiveAccountLinkByPhone.mockResolvedValue({
      link: link(),
      codeHash: hashCode(PHONE, "123456"),
    });
    consumeAccountLinkById.mockResolvedValue(false);

    expect(await verifyPhoneCode({ phone: PHONE, code: "123456" })).toEqual({
      ok: false,
      error: VERIFY_CODE_ERROR.noChallenge,
    });
  });

  it("matches a code typed with the number formatted differently", async () => {
    findLiveAccountLinkByPhone.mockResolvedValue({
      link: link(),
      codeHash: hashCode(PHONE, "123456"),
    });

    const result = await verifyPhoneCode({
      phone: "+1 (512) 226-3512",
      code: "123456",
    });

    expect(result.ok).toBe(true);
  });
});
