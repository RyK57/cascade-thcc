import type { Session } from "@supabase/supabase-js";
import { createClient } from "./server";

export async function getSession(): Promise<Session | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getUserId(): Promise<string | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}
