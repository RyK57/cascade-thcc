import { createHash } from "node:crypto";
import { getUserByPhone, upsertUserByPhone } from "@/db/users";
import { ensureSandboxStartingBalance } from "@/libs/dynamic/sandbox-starting-balance";
import { USER_ROLE } from "@/utils/schema/user";

/**
 * The address `ensurePhoneWallet` derives before anyone has connected a real
 * wallet. It is deterministic and nobody holds its key, so it must never
 * receive an on-chain payout.
 */
export function derivedPlaceholderAddress(phone: string): string {
  const hash = createHash("sha256").update(`cascade-sandbox:${phone}`).digest("hex");
  return `0x${hash.slice(0, 40)}`;
}

export function isDerivedPlaceholder(
  phone: string | undefined,
  address: string | undefined
): boolean {
  if (!phone || !address) return true;
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) return true;
  return address.toLowerCase() === derivedPlaceholderAddress(phone).toLowerCase();
}

/**
 * Bind the wallet someone connected on the web app to the phone they text
 * from. Without this the iMessage identity and the Dynamic wallet are two
 * unrelated accounts, and peer payouts have nowhere real to land.
 *
 * `verified` means the caller proved they own the phone (a phone-verified web
 * session). Unverified callers — anyone who merely opened a job's pay URL — may
 * only fill an empty slot, never move a payout destination that is already set.
 * Overwriting on possession of a link is how a stranger's wallet ends up
 * receiving someone else's refunds.
 */
export async function linkRequesterWallet(params: {
  phone: string;
  walletAddress: string;
  verified?: boolean;
}): Promise<void> {
  const phone = params.phone.trim();
  const walletAddress = params.walletAddress.trim();
  if (!phone || !/^0x[0-9a-fA-F]{40}$/.test(walletAddress)) return;
  if (isDerivedPlaceholder(phone, walletAddress)) return;

  const existing = await getUserByPhone(phone).catch(() => null);
  if (existing?.walletAddress?.toLowerCase() === walletAddress.toLowerCase()) {
    // Already linked — still top up the one-time sandbox stipend if missing.
    await ensureSandboxStartingBalance(existing);
    return;
  }

  const hasRealWallet = !isDerivedPlaceholder(phone, existing?.walletAddress);
  if (hasRealWallet && !params.verified) {
    console.warn(
      "[cascade] refused unverified wallet relink for an account that already has one"
    );
    return;
  }

  const linked = await upsertUserByPhone({
    phone,
    role: existing?.role ?? USER_ROLE.both,
    walletAddress,
    creditBalance: existing?.creditBalance,
    trustScore: existing?.trustScore,
    fullName: existing?.fullName,
    email: existing?.email,
  });
  // Dynamic web wallets are Cascade accounts too — give them the sandbox stipend.
  await ensureSandboxStartingBalance(linked);
}
