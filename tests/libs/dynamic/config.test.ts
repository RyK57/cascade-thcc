import { afterEach, describe, expect, it } from "vitest";
import { isDynamicConfigured } from "@/libs/dynamic";

const ORIGINAL = process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID;

afterEach(() => {
  process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID = ORIGINAL;
});

describe("isDynamicConfigured", () => {
  it("returns false without environment id", () => {
    delete process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID;
    expect(isDynamicConfigured()).toBe(false);
  });

  it("returns true with environment id", () => {
    process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID = "env-123";
    expect(isDynamicConfigured()).toBe(true);
  });
});
