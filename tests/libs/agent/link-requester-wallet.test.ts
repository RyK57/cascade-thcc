import { beforeEach, describe, expect, it, vi } from "vitest";

const getUserByPhone = vi.fn();
const upsertUserByPhone = vi.fn();

vi.mock("@/db/users", () => ({
  getUserByPhone: (...args: unknown[]) => getUserByPhone(...args),
  upsertUserByPhone: (...args: unknown[]) => upsertUserByPhone(...args),
}));

import {
  derivedPlaceholderAddress,
  isDerivedPlaceholder,
  linkRequesterWallet,
} from "@/libs/agent/link-requester-wallet";

const PHONE = "+15122263512";
const REAL_WALLET = "0x1111111111111111111111111111111111111111";

beforeEach(() => {
  vi.clearAllMocks();
  getUserByPhone.mockResolvedValue(null);
});

describe("isDerivedPlaceholder", () => {
  it("flags the deterministic address nobody holds a key for", () => {
    expect(isDerivedPlaceholder(PHONE, derivedPlaceholderAddress(PHONE))).toBe(
      true
    );
  });

  it("accepts a connected wallet address", () => {
    expect(isDerivedPlaceholder(PHONE, REAL_WALLET)).toBe(false);
  });
});

describe("linkRequesterWallet", () => {
  it("binds the web wallet to the texting phone", async () => {
    await linkRequesterWallet({ phone: PHONE, walletAddress: REAL_WALLET });

    expect(upsertUserByPhone).toHaveBeenCalledWith(
      expect.objectContaining({ phone: PHONE, walletAddress: REAL_WALLET })
    );
  });

  it("never persists a derived placeholder", async () => {
    await linkRequesterWallet({
      phone: PHONE,
      walletAddress: derivedPlaceholderAddress(PHONE),
    });

    expect(upsertUserByPhone).not.toHaveBeenCalled();
  });

  it("skips a redundant write when already linked", async () => {
    getUserByPhone.mockResolvedValue({ walletAddress: REAL_WALLET });

    await linkRequesterWallet({ phone: PHONE, walletAddress: REAL_WALLET });

    expect(upsertUserByPhone).not.toHaveBeenCalled();
  });
});
