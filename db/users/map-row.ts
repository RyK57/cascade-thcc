import type { User, UserRole } from "@/utils/schema/user";

export interface UserRow {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  phone_verified_at: string | null;
  role: string;
  credit_balance: number;
  wallet_address: string | null;
  trust_score: number;
  last_lat: number | null;
  last_lng: number | null;
  created_at: string;
}

export const USER_ROW_COLUMNS =
  "id, email, full_name, phone, phone_verified_at, role, credit_balance, wallet_address, trust_score, last_lat, last_lng, created_at";

export function mapUserRow(row: UserRow): User {
  return {
    id: row.id,
    email: row.email ?? undefined,
    fullName: row.full_name ?? undefined,
    phone: row.phone ?? undefined,
    phoneVerifiedAt: row.phone_verified_at ?? undefined,
    role: row.role as UserRole,
    creditBalance: row.credit_balance,
    walletAddress: row.wallet_address ?? undefined,
    trustScore: row.trust_score,
    lastLat: row.last_lat ?? undefined,
    lastLng: row.last_lng ?? undefined,
    createdAt: row.created_at,
  };
}
