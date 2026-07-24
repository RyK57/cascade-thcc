function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * Literal `process.env.NEXT_PUBLIC_*` access, not a computed lookup.
 *
 * Next inlines public env vars into the client bundle by substituting exact
 * member expressions; `process.env[name]` is not matched, and in the browser
 * `process.env` is an empty shim. A dynamic read therefore returns undefined
 * on the client no matter how the vars are set, which would make every
 * browser-side Supabase client silently fail to initialize.
 */
function publicUrl(): string | undefined {
  return clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

function publicAnonKey(): string | undefined {
  return clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/** True when both public Supabase env vars are set and non-empty. */
export function isSupabaseConfigured(): boolean {
  return Boolean(publicUrl() && publicAnonKey());
}

export function getSupabasePublicConfig():
  | { url: string; anonKey: string }
  | null {
  const url = publicUrl();
  const anonKey = publicAnonKey();

  if (!url || !anonKey) return null;

  return { url, anonKey };
}
