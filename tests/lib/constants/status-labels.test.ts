import { describe, expect, it } from "vitest";
import {
  labelJobStatus,
  labelJobTier,
  labelPaymentStatus,
} from "@/lib/constants/status-labels";

describe("status labels", () => {
  it("maps job statuses to customer-facing copy", () => {
    expect(labelJobStatus("payment_pending")).toBe("Payment due");
    expect(labelJobStatus("funded")).toBe("Escrow held");
    expect(labelJobStatus("paid")).toBe("Paid");
  });

  it("maps payment statuses to customer-facing copy", () => {
    expect(labelPaymentStatus("authorized")).toBe("Escrow held");
    expect(labelPaymentStatus("settled")).toBe("Paid");
  });

  it("maps tiers without leaking internal jargon", () => {
    expect(labelJobTier("peer")).toBe("Peer");
    expect(labelJobTier("expert")).toBe("Expert");
    expect(labelJobTier(undefined)).toBe("—");
  });
});
