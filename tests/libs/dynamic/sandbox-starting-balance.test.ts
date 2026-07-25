import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/db/users", () => ({
  adjustCredits: vi.fn(),
}));

vi.mock("@/db/ledger", () => ({
  createLedgerEntry: vi.fn(),
}));

vi.mock("@/utils/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

import { createLedgerEntry } from "@/db/ledger";
import { adjustCredits } from "@/db/users";
import { createAdminClient } from "@/utils/supabase/admin";
import {
  ensureSandboxStartingBalance,
  SANDBOX_STARTING_BALANCE_REASON,
} from "@/libs/dynamic/sandbox-starting-balance";
import type { User } from "@/utils/schema/user";

function user(overrides: Partial<User> = {}): User {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    role: "both",
    creditBalance: 0,
    trustScore: 50,
    createdAt: "2026-07-24T00:00:00.000Z",
    ...overrides,
  };
}

function mockLedger(exists: boolean) {
  const maybeSingle = vi.fn().mockResolvedValue({
    data: exists ? { id: "ledger-1" } : null,
    error: null,
  });
  const limit = vi.fn(() => ({ maybeSingle }));
  const eqReason = vi.fn(() => ({ limit }));
  const eqUser = vi.fn(() => ({ eq: eqReason }));
  const select = vi.fn(() => ({ eq: eqUser }));
  vi.mocked(createAdminClient).mockReturnValue({
    from: vi.fn(() => ({ select })),
  } as never);
  return { eqReason };
}

describe("ensureSandboxStartingBalance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stamps a grant marker when balance is already at the stipend", async () => {
    mockLedger(false);
    vi.mocked(createLedgerEntry).mockResolvedValue({
      id: "ledger-marker",
      userId: "11111111-1111-1111-1111-111111111111",
      deltaCredits: 0,
      reason: SANDBOX_STARTING_BALANCE_REASON,
      createdAt: "2026-07-24T00:00:00.000Z",
    });
    const funded = user({ creditBalance: 100 });
    await expect(ensureSandboxStartingBalance(funded)).resolves.toBe(funded);
    expect(adjustCredits).not.toHaveBeenCalled();
    expect(createLedgerEntry).toHaveBeenCalledWith({
      userId: funded.id,
      deltaCredits: 0,
      reason: SANDBOX_STARTING_BALANCE_REASON,
    });
  });

  it("no-ops when the stipend was already ledgered (even if spent down)", async () => {
    mockLedger(true);
    const broke = user({ creditBalance: 12 });
    await expect(ensureSandboxStartingBalance(broke)).resolves.toBe(broke);
    expect(adjustCredits).not.toHaveBeenCalled();
    expect(createLedgerEntry).not.toHaveBeenCalled();
  });

  it("tops an underfunded account up to 100 credits once", async () => {
    const { eqReason } = mockLedger(false);
    const topped = user({ creditBalance: 100 });
    vi.mocked(adjustCredits).mockResolvedValue(topped);

    const result = await ensureSandboxStartingBalance(user({ creditBalance: 25 }));

    expect(eqReason).toHaveBeenCalledWith(
      "reason",
      SANDBOX_STARTING_BALANCE_REASON
    );
    expect(adjustCredits).toHaveBeenCalledWith({
      userId: "11111111-1111-1111-1111-111111111111",
      deltaCredits: 75,
      reason: SANDBOX_STARTING_BALANCE_REASON,
    });
    expect(result).toBe(topped);
  });
});
