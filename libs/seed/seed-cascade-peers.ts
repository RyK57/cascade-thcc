import { USER_ROLE } from "@/utils/schema/user";
import { upsertUserByPhone } from "@/db/users";
import { CASCADE_PEERS } from "./cascade-peers";

export interface SeedCascadePeersResult {
  count: number;
  phones: string[];
}

export async function seedCascadePeers(): Promise<SeedCascadePeersResult> {
  const phones: string[] = [];

  for (const peer of CASCADE_PEERS) {
    await upsertUserByPhone({
      phone: peer.phone,
      email: peer.email,
      fullName: peer.fullName,
      role: USER_ROLE.peer,
      creditBalance: peer.creditBalance,
      trustScore: peer.trustScore,
    });
    phones.push(peer.phone);
  }

  return { count: phones.length, phones };
}
