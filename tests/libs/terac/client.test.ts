import { afterEach, describe, expect, it } from "vitest";
import { getTeracBaseUrl, isTeracConfigured } from "@/libs/terac";

const ORIGINAL = {
  TERAC_API_KEY: process.env.TERAC_API_KEY,
  TERAC_API_BASE_URL: process.env.TERAC_API_BASE_URL,
};

afterEach(() => {
  process.env.TERAC_API_KEY = ORIGINAL.TERAC_API_KEY;
  process.env.TERAC_API_BASE_URL = ORIGINAL.TERAC_API_BASE_URL;
});

describe("terac client config", () => {
  it("detects missing API key", () => {
    delete process.env.TERAC_API_KEY;
    expect(isTeracConfigured()).toBe(false);
  });

  it("uses default base URL", () => {
    delete process.env.TERAC_API_BASE_URL;
    expect(getTeracBaseUrl()).toBe("https://terac.com/api/external/v2");
  });
});
