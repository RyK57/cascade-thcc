import { USER_ROLE } from "@/utils/schema/user";
import { getUserByPhone, upsertUserByPhone } from "@/db/users";
import { CASCADE_PEERS } from "./cascade-peers";

export interface SeedCascadePeersResult {
  count: number;
  phones: string[];
}

/**
 * Idempotent peer seed. Re-running must not wipe demo state: seeded credit
 * balances are 0 and trust scores are fixed starting values, and upsert treats
 * a supplied 0 as "set to 0" (`??` doesn't skip it), so passing them for a peer
 * that already exists erases earned credits and audited trust.
 */
export async function seedCascadePeers(): Promise<SeedCascadePeersResult> {
  const phones: string[] = [];

  for (const peer of CASCADE_PEERS) {
    const existing = await getUserByPhone(peer.phone);

    await upsertUserByPhone({
      phone: peer.phone,
      email: peer.email,
      fullName: peer.fullName,
      role: USER_ROLE.peer,
      creditBalance: existing ? undefined : peer.creditBalance,
      trustScore: existing ? undefined : peer.trustScore,
      lastLat: peer.lastLat,
      lastLng: peer.lastLng,
    });
    phones.push(peer.phone);
  }

  return { count: phones.length, phones };
}
