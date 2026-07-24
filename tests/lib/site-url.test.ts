import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getSiteUrl, isLocalSiteUrl, LOCAL_SITE_URL } from "@/lib/constants/site";

const KEYS = [
  "NEXT_PUBLIC_SITE_URL",
  "VERCEL_PROJECT_PRODUCTION_URL",
  "NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL",
  "VERCEL_URL",
  "NEXT_PUBLIC_VERCEL_URL",
];

const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const key of KEYS) {
    saved[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

describe("getSiteUrl", () => {
  it("prefers an explicit site URL", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://cascade.example.com/";
    process.env.VERCEL_URL = "deploy-abc.vercel.app";

    expect(getSiteUrl()).toBe("https://cascade.example.com");
  });

  it("uses the deployed domain when no site URL is set", () => {
    // Vercel supplies a bare host; a texted link needs a scheme.
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "cascade.vercel.app";

    expect(getSiteUrl()).toBe("https://cascade.vercel.app");
  });

  it("prefers the stable production domain over a per-deploy URL", () => {
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "cascade.vercel.app";
    process.env.VERCEL_URL = "cascade-git-branch-abc.vercel.app";

    expect(getSiteUrl()).toBe("https://cascade.vercel.app");
  });

  it("falls back to localhost only when nothing else is configured", () => {
    expect(getSiteUrl()).toBe(LOCAL_SITE_URL);
  });

  it("ignores an empty value rather than treating it as configured", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "   ";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "cascade.vercel.app";

    expect(getSiteUrl()).toBe("https://cascade.vercel.app");
  });
});

describe("isLocalSiteUrl", () => {
  it("recognises the origins a phone cannot open", () => {
    expect(isLocalSiteUrl("http://localhost:3000")).toBe(true);
    expect(isLocalSiteUrl("http://127.0.0.1:3000")).toBe(true);
    expect(isLocalSiteUrl("https://cascade.example.com")).toBe(false);
  });
});
