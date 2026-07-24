import type { Session } from "@supabase/supabase-js";

export function isSessionValid(session: Session | null): boolean {
  if (!session) return false;
  const expiresAt = session.expires_at ?? 0;
  return expiresAt * 1000 > Date.now();
}
