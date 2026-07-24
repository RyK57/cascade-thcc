import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/db/users", () => ({
  getUserByPhone: vi.fn(),
  upsertUserByPhone: vi.fn(),
}));

import { getUserByPhone, upsertUserByPhone } from "@/db/users";
import { ensurePhoneWallet } from "@/libs/dynamic/phone-wallet";

describe("ensurePhoneWallet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.DYNAMIC_PREGEN_WALLETS;
  });

  it("returns existing wallet without upsert", async () => {
    vi.mocked(getUserByPhone).mockResolvedValue({
      id: "u1",
      phone: "+15550001111",
      role: "both",
      creditBalance: 0,
      trustScore: 50,
      walletAddress: "0xexisting",
      createdAt: "2026-07-24T00:00:00.000Z",
    });

    const user = await ensurePhoneWallet("+15550001111");
    expect(user.walletAddress).toBe("0xexisting");
    expect(upsertUserByPhone).not.toHaveBeenCalled();
  });

  it("derives a deterministic sandbox address from the phone", async () => {
    vi.mocked(getUserByPhone).mockResolvedValue(null);
    vi.mocked(upsertUserByPhone).mockImplementation(async (input) => ({
      id: "u2",
      phone: input.phone!,
      role: input.role ?? "both",
      creditBalance: 0,
      trustScore: 50,
      walletAddress: input.walletAddress,
      createdAt: "2026-07-24T00:00:00.000Z",
    }));

    const phone = "+15550009999";
    const expected = `0x${createHash("sha256")
      .update(`cascade-sandbox:${phone}`)
      .digest("hex")
      .slice(0, 40)}`;

    const user = await ensurePhoneWallet(phone);
    expect(user.walletAddress).toBe(expected);
    expect(upsertUserByPhone).toHaveBeenCalled();
  });
});
