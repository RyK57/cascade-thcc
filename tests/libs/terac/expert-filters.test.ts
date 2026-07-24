import { describe, expect, it } from "vitest";
import { expertFiltersForJob } from "@/libs/terac/list-filters";

describe("expertFiltersForJob", () => {
  it("targets senior engineers by default", () => {
    expect(expertFiltersForJob("Review my Stripe webhooks").roleLabel).toBe(
      "senior engineer"
    );
  });

  it("detects legal and design roles", () => {
    expect(expertFiltersForJob("Need a lawyer for NDA").roleLabel).toContain(
      "attorney"
    );
    expect(expertFiltersForJob("UX audit of onboarding").roleLabel).toContain(
      "designer"
    );
  });
});
