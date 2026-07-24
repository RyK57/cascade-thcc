import type { User, UserRole } from "@/utils/schema/user";

export interface UserRow {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: string;
  credit_balance: number;
  wallet_address: string | null;
  trust_score: number;
  created_at: string;
}

export const USER_ROW_COLUMNS =
  "id, email, full_name, phone, role, credit_balance, wallet_address, trust_score, created_at";

export function mapUserRow(row: UserRow): User {
  return {
    id: row.id,
    email: row.email ?? undefined,
    fullName: row.full_name ?? undefined,
    phone: row.phone ?? undefined,
    role: row.role as UserRole,
    creditBalance: row.credit_balance,
    walletAddress: row.wallet_address ?? undefined,
    trustScore: row.trust_score,
    createdAt: row.created_at,
  };
}
