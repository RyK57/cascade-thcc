import type { AccountLink, AccountSession } from "@/utils/schema/account";
import { ACCOUNT_LINK_PURPOSE } from "@/utils/schema/account";

export interface AccountLinkRow {
  id: string;
  phone: string;
  user_id: string | null;
  job_id: string | null;
  purpose: string;
  expires_at: string;
  consumed_at: string | null;
  attempts: number;
  created_at: string;
}

export const ACCOUNT_LINK_ROW_COLUMNS =
  "id, phone, user_id, job_id, purpose, expires_at, consumed_at, attempts, created_at";

export function mapAccountLinkRow(row: AccountLinkRow): AccountLink {
  return {
    id: row.id,
    phone: row.phone,
    userId: row.user_id ?? undefined,
    jobId: row.job_id ?? undefined,
    purpose:
      row.purpose === ACCOUNT_LINK_PURPOSE.pay
        ? ACCOUNT_LINK_PURPOSE.pay
        : ACCOUNT_LINK_PURPOSE.link,
    expiresAt: row.expires_at,
    consumedAt: row.consumed_at ?? undefined,
    attempts: row.attempts,
    createdAt: row.created_at,
  };
}

export interface AccountSessionRow {
  id: string;
  user_id: string;
  phone: string;
  expires_at: string;
  revoked_at: string | null;
  last_seen_at: string;
  created_at: string;
}

export const ACCOUNT_SESSION_ROW_COLUMNS =
  "id, user_id, phone, expires_at, revoked_at, last_seen_at, created_at";

export function mapAccountSessionRow(row: AccountSessionRow): AccountSession {
  return {
    id: row.id,
    userId: row.user_id,
    phone: row.phone,
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at ?? undefined,
    lastSeenAt: row.last_seen_at,
    createdAt: row.created_at,
  };
}
