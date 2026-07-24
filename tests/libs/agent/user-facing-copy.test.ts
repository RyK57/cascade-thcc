import { describe, expect, it } from "vitest";
import {
  agentPayOfferReply,
  approvedWorkReply,
  escrowRequestReply,
  fundedViaCreditsReply,
  peerClaimBroadcast,
  peerFundedReply,
  peerQuoteReply,
  signupRequiredReply,
} from "@/libs/agent/reply-templates";

/** Every string the product can send to a person, with plausible inputs. */
const MESSAGES = [
  peerQuoteReply({
    title: "Test my signup",
    priceCents: 1200,
    payUrl: "https://cascade.example.com/l/tok",
    quoteLine: "12.00 USDC + ~$0.01 network fee → $12.01 total",
  }),
  peerFundedReply("Test my signup"),
  peerClaimBroadcast({ title: "Test my signup", priceCents: 1200 }),
  fundedViaCreditsReply("Test my signup"),
  approvedWorkReply("https://cascade.example.com/l/tok", "$150.00"),
  agentPayOfferReply("https://pay.example.com/x"),
  signupRequiredReply("https://cascade.example.com/l/tok"),
  escrowRequestReply({
    title: "Test my signup",
    quoteLine: "0.0048 ETH (≈ $12.00, 1 ETH ≈ $2,500)",
    destination: "0xAgent00000000000000000000000000000000001",
    network: "Base Sepolia",
    payUrl: "https://cascade.example.com/l/tok",
  }),
];

describe("user-facing copy", () => {
  it("never quotes a negative amount", () => {
    // "expert -$3.60" was an expected-value figure leaking into a price slot.
    for (const message of MESSAGES) {
      expect(message).not.toMatch(/-\s?\$\d/);
      expect(message).not.toMatch(/\$-\d/);
    }
  });

  it("never exposes Cascade's routing economics", () => {
    for (const message of MESSAGES) {
      expect(message).not.toMatch(/\bEV\b/);
      expect(message).not.toMatch(/expected value/i);
      expect(message).not.toMatch(/\bp≈/);
      expect(message).not.toMatch(/peer \$.* vs expert/i);
    }
  });

  it("never quotes a worker's trust score back at them", () => {
    const offer = peerClaimBroadcast({ title: "Test my signup", priceCents: 1200 });

    expect(offer).not.toMatch(/rating/i);
    expect(offer).not.toMatch(/trust/i);
    // The pay and the way to take the job still have to be there.
    expect(offer).toContain("$12.00");
    expect(offer.toLowerCase()).toContain("claim");
  });
});

describe("escrowRequestReply", () => {
  it("carries everything needed to actually send the money", () => {
    const reply = escrowRequestReply({
      title: "Test my signup",
      quoteLine: "0.0048 ETH (≈ $12.00, 1 ETH ≈ $2,500)",
      destination: "0xAgent00000000000000000000000000000000001",
      network: "Base Sepolia",
      payUrl: "https://cascade.example.com/l/tok",
    });

    expect(reply).toContain("0.0048 ETH");
    expect(reply).toContain("≈ $12.00");
    expect(reply).toContain("Base Sepolia");
    expect(reply).toContain("0xAgent00000000000000000000000000000000001");
    expect(reply).toContain("https://cascade.example.com/l/tok");
  });
});
