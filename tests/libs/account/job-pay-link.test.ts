import { beforeEach, describe, expect, it, vi } from "vitest";

const issueAccountLink = vi.fn();

vi.mock("@/libs/account/issue-link", () => ({
  issueAccountLink: (...args: unknown[]) => issueAccountLink(...args),
}));

import { jobPayLink } from "@/libs/account/job-pay-link";

const JOB_ID = "55555555-5555-4555-8555-555555555555";
const PHONE = "+15122263512";

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SITE_URL = "https://cascade.test";
});

describe("jobPayLink", () => {
  it("hands out an account-bound link so paying is an authenticated act", async () => {
    issueAccountLink.mockResolvedValue({
      url: "https://cascade.test/l/token",
      code: "123456",
      expiresAt: new Date(),
    });

    expect(await jobPayLink({ jobId: JOB_ID, phone: PHONE })).toBe(
      "https://cascade.test/l/token"
    );
    expect(issueAccountLink).toHaveBeenCalledWith(
      expect.objectContaining({ jobId: JOB_ID, purpose: "pay" })
    );
  });

  it("falls back to the plain pay URL when accounts are unavailable", async () => {
    // A demo with no database still has to be able to take a payment.
    issueAccountLink.mockResolvedValue(null);

    expect(await jobPayLink({ jobId: JOB_ID, phone: PHONE })).toBe(
      `https://cascade.test/main?job=${JOB_ID}`
    );
  });

  it("falls back when issuing throws", async () => {
    issueAccountLink.mockRejectedValue(new Error("db down"));

    expect(await jobPayLink({ jobId: JOB_ID, phone: PHONE })).toContain(
      `?job=${JOB_ID}`
    );
  });
});
