import { createClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "./config";

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export function isSupabaseAdminConfigured(): boolean {
  return Boolean(getSupabasePublicConfig() && readEnv("SUPABASE_SERVICE_ROLE_KEY"));
}

export function createAdminClient() {
  const config = getSupabasePublicConfig();
  const serviceRoleKey = readEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!config || !serviceRoleKey) {
    throw new Error(
      "Supabase admin is not configured. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createClient(config.url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
