import { describe, expect, it } from "vitest";
import {
  looksLikeBluff,
  shouldAuditDeliverable,
} from "@/libs/agent/trust-audit";

describe("looksLikeBluff", () => {
  it("flags short or substance-free deliverables", () => {
    expect(looksLikeBluff("done")).toBe(true);
    expect(looksLikeBluff("lmk")).toBe(true);
    expect(looksLikeBluff("ok")).toBe(true);
    expect(
      looksLikeBluff(
        "Picked up the package at the west gate and left it with the front desk."
      )
    ).toBe(false);
  });
});

describe("shouldAuditDeliverable", () => {
  it("defaults to auditing every deliverable in demo mode", () => {
    const prev = process.env.CASCADE_TRUST_AUDIT_EVERY;
    delete process.env.CASCADE_TRUST_AUDIT_EVERY;
    expect(shouldAuditDeliverable(1)).toBe(true);
    process.env.CASCADE_TRUST_AUDIT_EVERY = "2";
    expect(shouldAuditDeliverable(1)).toBe(false);
    expect(shouldAuditDeliverable(2)).toBe(true);
    if (prev === undefined) delete process.env.CASCADE_TRUST_AUDIT_EVERY;
    else process.env.CASCADE_TRUST_AUDIT_EVERY = prev;
  });
});
