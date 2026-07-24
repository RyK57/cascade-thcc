import { beforeEach, describe, expect, it, vi } from "vitest";

const createAccountLink = vi.fn();
const upsertUserByPhone = vi.fn();
const isSupabaseAdminConfigured = vi.fn(() => true);

vi.mock("@/db/accounts", () => ({
  createAccountLink: (...args: unknown[]) => createAccountLink(...args),
}));

vi.mock("@/db/users", () => ({
  upsertUserByPhone: (...args: unknown[]) => upsertUserByPhone(...args),
}));

vi.mock("@/utils/supabase/admin", () => ({
  isSupabaseAdminConfigured: () => isSupabaseAdminConfigured(),
}));

import { issueAccountLink } from "@/libs/account/issue-link";
import { hashCode, hashToken } from "@/libs/account/tokens";

const PHONE = "+15122263512";
const USER_ID = "44444444-4444-4444-8444-444444444444";

beforeEach(() => {
  vi.clearAllMocks();
  isSupabaseAdminConfigured.mockReturnValue(true);
  upsertUserByPhone.mockResolvedValue({ id: USER_ID });
  createAccountLink.mockResolvedValue({});
  process.env.NEXT_PUBLIC_SITE_URL = "https://cascade.test";
});

describe("issueAccountLink", () => {
  it("stores only hashes and hands back the raw credentials once", async () => {
    const issued = await issueAccountLink({ phone: PHONE });

    expect(issued).not.toBeNull();
    const stored = createAccountLink.mock.calls[0][0];
    expect(stored.tokenHash).toBe(
      hashToken(issued!.url.split("/l/")[1])
    );
    expect(stored.codeHash).toBe(hashCode(PHONE, issued!.code));
    // The raw token must never be a column value.
    expect(JSON.stringify(stored)).not.toContain(issued!.code);
  });

  it("builds a link on the configured site origin", async () => {
    const issued = await issueAccountLink({ phone: PHONE });

    expect(issued?.url.startsWith("https://cascade.test/l/")).toBe(true);
  });

  it("normalizes the handle so one person keeps one account", async () => {
    await issueAccountLink({ phone: "+1 (512) 226-3512" });

    expect(createAccountLink.mock.calls[0][0].phone).toBe(PHONE);
  });

  it("carries the job through so a pay link lands on checkout", async () => {
    const jobId = "55555555-5555-4555-8555-555555555555";

    await issueAccountLink({ phone: PHONE, jobId, purpose: "pay" });

    expect(createAccountLink).toHaveBeenCalledWith(
      expect.objectContaining({ jobId, purpose: "pay" })
    );
  });

  it("expires within the half hour a texted link is trusted for", async () => {
    const issued = await issueAccountLink({ phone: PHONE });
    const minutes = (issued!.expiresAt.getTime() - Date.now()) / 60_000;

    expect(minutes).toBeGreaterThan(25);
    expect(minutes).toBeLessThanOrEqual(30);
  });

  it("declines when there is no database to record the challenge in", async () => {
    isSupabaseAdminConfigured.mockReturnValue(false);

    expect(await issueAccountLink({ phone: PHONE })).toBeNull();
    expect(createAccountLink).not.toHaveBeenCalled();
  });
});
