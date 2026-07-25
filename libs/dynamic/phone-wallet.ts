import { createHash } from "node:crypto";
import { getUserByPhone, upsertUserByPhone } from "@/db/users";
import { USER_ROLE, type User } from "@/utils/schema/user";
import { SANDBOX_STARTING_CREDITS } from "./sandbox";
import { ensureSandboxStartingBalance } from "./sandbox-starting-balance";

/**
 * Ensure a sandbox wallet address exists for a phone-keyed user.
 * Dynamic pregen API when DYNAMIC_PREGEN_WALLETS=1; else deterministic placeholder.
 * Also tops up the one-time $100 sandbox starting balance when missing.
 */
export async function ensurePhoneWallet(phone: string): Promise<User> {
  const existing = await getUserByPhone(phone);
  if (existing?.walletAddress) {
    return ensureSandboxStartingBalance(existing);
  }

  const address = await createOrDeriveWalletAddress(phone);
  const user = await upsertUserByPhone({
    phone,
    role: existing?.role ?? USER_ROLE.both,
    walletAddress: address,
    // New rows get the stipend; existing rows keep earned balance.
    creditBalance: existing?.creditBalance ?? SANDBOX_STARTING_CREDITS,
    trustScore: existing?.trustScore,
    fullName: existing?.fullName,
    email: existing?.email,
  });
  return ensureSandboxStartingBalance(user);
}

async function createOrDeriveWalletAddress(phone: string): Promise<string> {
  if (process.env.DYNAMIC_PREGEN_WALLETS?.trim() === "1") {
    try {
      // Placeholder hook for Dynamic pregenerated wallet API — sandbox only.
      const res = await fetch("https://app.dynamic.xyz/api/v0/sdk/pregenerated", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.DYNAMIC_API_KEY ?? ""}`,
        },
        body: JSON.stringify({
          environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID,
          externalUserId: phone,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { address?: string };
        if (data.address) return data.address;
      }
    } catch (error) {
      console.warn("[dynamic] pregen wallet failed; deriving sandbox address", error);
    }
  }

  const hash = createHash("sha256").update(`cascade-sandbox:${phone}`).digest("hex");
  return `0x${hash.slice(0, 40)}`;
}
