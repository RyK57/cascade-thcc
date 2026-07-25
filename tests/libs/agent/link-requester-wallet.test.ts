import { beforeEach, describe, expect, it, vi } from "vitest";

const getUserByPhone = vi.fn();
const upsertUserByPhone = vi.fn();
const ensureSandboxStartingBalance = vi.fn(async (user: unknown) => user);

vi.mock("@/db/users", () => ({
  getUserByPhone: (...args: unknown[]) => getUserByPhone(...args),
  upsertUserByPhone: (...args: unknown[]) => upsertUserByPhone(...args),
}));

vi.mock("@/libs/dynamic/sandbox-starting-balance", () => ({
  ensureSandboxStartingBalance: (...args: unknown[]) =>
    ensureSandboxStartingBalance(...args),
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
  upsertUserByPhone.mockImplementation(async (input: { phone: string }) => ({
    id: "user-1",
    phone: input.phone,
    creditBalance: 0,
  }));
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

  it("skips a redundant write when already linked but still grants stipend", async () => {
    const existing = { id: "user-1", walletAddress: REAL_WALLET, creditBalance: 0 };
    getUserByPhone.mockResolvedValue(existing);

    await linkRequesterWallet({ phone: PHONE, walletAddress: REAL_WALLET });

    expect(upsertUserByPhone).not.toHaveBeenCalled();
    expect(ensureSandboxStartingBalance).toHaveBeenCalledWith(existing);
  });

  it("refuses to repoint an existing wallet without phone verification", async () => {
    getUserByPhone.mockResolvedValue({ walletAddress: REAL_WALLET });

    // Anyone who opens the pay URL can fund; only the phone owner may change
    // where this account's money lands.
    await linkRequesterWallet({
      phone: PHONE,
      walletAddress: "0x2222222222222222222222222222222222222222",
    });

    expect(upsertUserByPhone).not.toHaveBeenCalled();
  });

  it("lets a phone-verified session move the wallet", async () => {
    getUserByPhone.mockResolvedValue({ walletAddress: REAL_WALLET });
    const replacement = "0x2222222222222222222222222222222222222222";

    await linkRequesterWallet({
      phone: PHONE,
      walletAddress: replacement,
      verified: true,
    });

    expect(upsertUserByPhone).toHaveBeenCalledWith(
      expect.objectContaining({ walletAddress: replacement })
    );
  });

  it("still fills an empty slot for an unverified funder", async () => {
    // The placeholder is not a real destination, so first-touch linking keeps
    // working for a requester who has not signed in yet.
    getUserByPhone.mockResolvedValue({
      walletAddress: derivedPlaceholderAddress(PHONE),
    });

    await linkRequesterWallet({ phone: PHONE, walletAddress: REAL_WALLET });

    expect(upsertUserByPhone).toHaveBeenCalledWith(
      expect.objectContaining({ walletAddress: REAL_WALLET })
    );
  });
});
