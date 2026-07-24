import { describe, expect, it } from "vitest";
import {
  approvedWorkReply,
  draftReadyReply,
  formatCents,
  workReadyReply,
} from "@/libs/agent/reply-templates";

describe("formatCents", () => {
  it("formats usd cents as dollars", () => {
    expect(formatCents(12345)).toBe("$123.45");
  });

  it("respects an explicit currency", () => {
    expect(formatCents(5000, "eur")).toBe("€50.00");
  });
});

describe("draftReadyReply", () => {
  it("surfaces the Terac quote and the confirm ask", () => {
    const reply = draftReadyReply({
      title: "Fix my Stripe webhooks",
      numParticipants: 1,
      totalCents: 15000,
      currency: "usd",
    });
    expect(reply).toContain("$150.00");
    expect(reply).toContain("YES");
    expect(reply).toContain("Drafts are free");
  });

  it("still asks for confirmation when pricing is pending", () => {
    const reply = draftReadyReply({ title: "Job", numParticipants: 1 });
    expect(reply).toContain("quoting");
    expect(reply).toContain("YES");
  });
});

describe("workReadyReply", () => {
  it("handles singular and plural deliverables", () => {
    expect(workReadyReply(1)).toContain("1 deliverable is");
    expect(workReadyReply(3)).toContain("3 deliverables are");
  });
});

describe("approvedWorkReply", () => {
  it("includes the payment link and amount", () => {
    const reply = approvedWorkReply("http://localhost:3000/main?job=j1", "$150.00");
    expect(reply).toContain("http://localhost:3000/main?job=j1");
    expect(reply).toContain("$150.00");
  });
});
