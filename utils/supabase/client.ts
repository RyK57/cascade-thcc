import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "./config";

export function createClient(): SupabaseClient | null {
  const config = getSupabasePublicConfig();
  if (!config) return null;

  return createSupabaseBrowserClient(config.url, config.anonKey);
}
