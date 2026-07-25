import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/db/users", () => ({
  getUserByPhone: vi.fn(),
  upsertUserByPhone: vi.fn(),
}));

vi.mock("@/libs/dynamic/sandbox-starting-balance", () => ({
  ensureSandboxStartingBalance: vi.fn(async (user: { id: string }) => user),
}));

import { getUserByPhone, upsertUserByPhone } from "@/db/users";
import { ensurePhoneWallet } from "@/libs/dynamic/phone-wallet";
import { ensureSandboxStartingBalance } from "@/libs/dynamic/sandbox-starting-balance";
import { SANDBOX_STARTING_CREDITS } from "@/libs/dynamic/sandbox";

describe("ensurePhoneWallet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.DYNAMIC_PREGEN_WALLETS;
  });

  it("returns existing wallet without upsert and grants sandbox stipend", async () => {
    const existing = {
      id: "u1",
      phone: "+15550001111",
      role: "both" as const,
      creditBalance: 0,
      trustScore: 50,
      walletAddress: "0xexisting",
      createdAt: "2026-07-24T00:00:00.000Z",
    };
    vi.mocked(getUserByPhone).mockResolvedValue(existing);
    vi.mocked(ensureSandboxStartingBalance).mockResolvedValue({
      ...existing,
      creditBalance: SANDBOX_STARTING_CREDITS,
    });

    const user = await ensurePhoneWallet("+15550001111");
    expect(user.walletAddress).toBe("0xexisting");
    expect(user.creditBalance).toBe(SANDBOX_STARTING_CREDITS);
    expect(upsertUserByPhone).not.toHaveBeenCalled();
    expect(ensureSandboxStartingBalance).toHaveBeenCalledWith(existing);
  });

  it("derives a deterministic sandbox address from the phone", async () => {
    vi.mocked(getUserByPhone).mockResolvedValue(null);
    vi.mocked(upsertUserByPhone).mockImplementation(async (input) => ({
      id: "u2",
      phone: input.phone!,
      role: input.role ?? "both",
      creditBalance: input.creditBalance ?? 0,
      trustScore: 50,
      walletAddress: input.walletAddress,
      createdAt: "2026-07-24T00:00:00.000Z",
    }));
    vi.mocked(ensureSandboxStartingBalance).mockImplementation(async (u) => u);

    const phone = "+15550009999";
    const expected = `0x${createHash("sha256")
      .update(`cascade-sandbox:${phone}`)
      .digest("hex")
      .slice(0, 40)}`;

    const user = await ensurePhoneWallet(phone);
    expect(user.walletAddress).toBe(expected);
    expect(upsertUserByPhone).toHaveBeenCalledWith(
      expect.objectContaining({ creditBalance: SANDBOX_STARTING_CREDITS })
    );
    expect(ensureSandboxStartingBalance).toHaveBeenCalled();
  });
});
