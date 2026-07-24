import { USER_ROLE } from "@/utils/schema/user";
import { createAdminClient } from "@/utils/supabase/admin";
import {
  mapUserRow,
  USER_ROW_COLUMNS,
  type UserRow,
} from "@/db/users/map-row";
import { CASCADE_PEERS } from "./cascade-peers";

export interface SeedCascadePeersResult {
  count: number;
  phones: string[];
}

const PLACEHOLDER_PEER_PHONES = [
  "+15550001001",
  "+15550001002",
  "+15550001003",
  "+15550001004",
] as const;

async function retireEmail(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string
): Promise<void> {
  const email = `retired-${userId.replace(/-/g, "").slice(0, 12)}@cascade.local`;
  const { error } = await supabase
    .from("users")
    .update({ email })
    .eq("id", userId);
  if (error) {
    throw new Error(`Failed to free peer email: ${error.message}`);
  }
}

/**
 * Idempotent peer seed. Safe when phones change but seed emails stay the same
 * (unique email constraint) — migrates the email row onto the new phone, or
 * updates the phone row after freeing a colliding email.
 *
 * Balance and trust are written only on insert. Seeded peers carry a 0 balance
 * and a fixed starting trust score, so applying them to a peer that already
 * exists erases credits they earned and trust an audit adjusted — while the
 * ledger rows survive, leaving the two permanently inconsistent.
 */
export async function seedCascadePeers(): Promise<SeedCascadePeersResult> {
  const supabase = createAdminClient();
  const phones: string[] = [];

  for (const peer of CASCADE_PEERS) {
    const { data: byPhone, error: phoneError } = await supabase
      .from("users")
      .select(USER_ROW_COLUMNS)
      .eq("phone", peer.phone)
      .maybeSingle<UserRow>();
    if (phoneError) {
      throw new Error(`Failed to look up peer by phone: ${phoneError.message}`);
    }

    const { data: byEmail, error: emailError } = await supabase
      .from("users")
      .select(USER_ROW_COLUMNS)
      .eq("email", peer.email)
      .maybeSingle<UserRow>();
    if (emailError) {
      throw new Error(`Failed to look up peer by email: ${emailError.message}`);
    }

    // Identity, safe to rewrite every run.
    const identityFields = {
      phone: peer.phone,
      email: peer.email,
      full_name: peer.fullName,
      role: USER_ROLE.peer,
      last_lat: peer.lastLat,
      last_lng: peer.lastLng,
    };

    // Earned state, seeded once and never overwritten.
    const initialFields = {
      credit_balance: peer.creditBalance,
      trust_score: peer.trustScore,
    };

    let targetId: string;

    if (byPhone && byEmail && byPhone.id !== byEmail.id) {
      // Real phone row already exists; seed email lives on an old placeholder.
      await retireEmail(supabase, byEmail.id);
      targetId = byPhone.id;
    } else if (byPhone) {
      targetId = byPhone.id;
    } else if (byEmail) {
      // Move the seeded peer identity onto the new phone.
      targetId = byEmail.id;
    } else {
      const { data, error } = await supabase
        .from("users")
        .insert({ ...identityFields, ...initialFields })
        .select(USER_ROW_COLUMNS)
        .single<UserRow>();
      if (error || !data) {
        throw new Error(error?.message ?? "Failed to create peer");
      }
      mapUserRow(data);
      phones.push(peer.phone);
      continue;
    }

    const { data, error } = await supabase
      .from("users")
      .update(identityFields)
      .eq("id", targetId)
      .select(USER_ROW_COLUMNS)
      .single<UserRow>();
    if (error || !data) {
      throw new Error(error?.message ?? "Failed to update peer");
    }
    mapUserRow(data);
    phones.push(peer.phone);
  }

  // Soft-retire leftover placeholder peers so they stop receiving broadcasts.
  for (const phone of PLACEHOLDER_PEER_PHONES) {
    if (phones.includes(phone)) continue;
    const { data: leftover } = await supabase
      .from("users")
      .select("id")
      .eq("phone", phone)
      .maybeSingle<{ id: string }>();
    if (!leftover) continue;
    await retireEmail(supabase, leftover.id);
    await supabase
      .from("users")
      .update({ phone: null, role: USER_ROLE.requester })
      .eq("id", leftover.id);
  }

  return { count: phones.length, phones };
}
