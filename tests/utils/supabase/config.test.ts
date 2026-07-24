import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getSupabasePublicConfig,
  isSupabaseConfigured,
} from "@/utils/supabase/config";

describe("isSupabaseConfigured", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns false when env vars are missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    expect(isSupabaseConfigured()).toBe(false);
    expect(getSupabasePublicConfig()).toBeNull();
  });

  it("returns false when only url is set", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    expect(isSupabaseConfigured()).toBe(false);
  });

  it("returns true when both env vars are set", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
    expect(isSupabaseConfigured()).toBe(true);
    expect(getSupabasePublicConfig()).toEqual({
      url: "https://example.supabase.co",
      anonKey: "anon-key",
    });
  });
});
