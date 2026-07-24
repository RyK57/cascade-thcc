import { afterEach, describe, expect, it } from "vitest";
import { isLinqConfigured } from "@/libs/linq";

const ORIGINAL = {
  LINQ_API_V3_API_KEY: process.env.LINQ_API_V3_API_KEY,
  LINQ_API_KEY: process.env.LINQ_API_KEY,
};

afterEach(() => {
  process.env.LINQ_API_V3_API_KEY = ORIGINAL.LINQ_API_V3_API_KEY;
  process.env.LINQ_API_KEY = ORIGINAL.LINQ_API_KEY;
});

describe("isLinqConfigured", () => {
  it("returns false when no key is set", () => {
    delete process.env.LINQ_API_V3_API_KEY;
    delete process.env.LINQ_API_KEY;
    expect(isLinqConfigured()).toBe(false);
  });

  it("returns true when LINQ_API_V3_API_KEY is set", () => {
    process.env.LINQ_API_V3_API_KEY = "test-key";
    delete process.env.LINQ_API_KEY;
    expect(isLinqConfigured()).toBe(true);
  });
});
