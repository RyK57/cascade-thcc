import { describe, expect, it } from "vitest";
import { buildJobFlow } from "@/libs/mission-control";
import type { MissionFlowInput } from "@/libs/mission-control";
import type { Job } from "@/utils/schema/job";
import type { Payment } from "@/utils/schema/payment";

const TREASURY = "0x2222222222222222222222222222222222222222";
const REQUESTER = "0x4444444444444444444444444444444444444444";

function job(status: Job["status"]): Job {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    linqChatId: "chat_1",
    requesterHandle: "+15555550100",
    title: "Demo job",
    status,
    createdAt: "2026-07-24T00:00:00Z",
    updatedAt: "2026-07-24T00:00:00Z",
  } as Job;
}

function payment(status: Payment["status"]): Payment {
  return {
    id: "22222222-2222-4222-8222-222222222222",
    jobId: "11111111-1111-4111-8111-111111111111",
    amountCents: 300,
    currency: "usd",
    status,
    createdAt: "2026-07-24T00:00:00Z",
    updatedAt: "2026-07-24T00:00:00Z",
  } as Payment;
}

function build(overrides: Partial<MissionFlowInput> = {}) {
  return buildJobFlow({
    job: job("quoted"),
    payment: payment("payment_pending"),
    treasuryAddress: TREASURY,
    requesterAddress: REQUESTER,
    balances: { [TREASURY]: { eth: "0.1", usdc: "3.25" } },
    ...overrides,
  });
}

function nodeState(result: ReturnType<typeof build>, id: string) {
  return result.nodes.find((n) => n.id === id)?.data.state;
}

function edge(result: ReturnType<typeof build>, id: string) {
  const found = result.edges.find((e) => e.id === id);
  if (!found) throw new Error(`edge ${id} missing`);
  return found;
}

describe("buildJobFlow (cascade lifecycle)", () => {
  it("renders 9 nodes (6 stages + 3 wallets) and 7 edges", () => {
    const result = build();
    expect(result.nodes).toHaveLength(9);
    expect(result.edges).toHaveLength(7);
  });

  it("quoted + pending payment: escrow edge animates, payout idle", () => {
    const result = build();
    expect(edge(result, "escrow-edge").animated).toBe(true);
    expect(edge(result, "payout-edge").animated).toBe(false);
    expect(nodeState(result, "wallet-requester")).toBe("active");
    expect(nodeState(result, "stage-quoted")).toBe("active");
  });

  it("funded: escrow done, treasury active, worker waking up", () => {
    const result = build({ job: job("funded"), payment: payment("settled") });
    expect(edge(result, "escrow-edge").animated).toBe(false);
    expect(edge(result, "escrow-edge").label).toBe("escrow funded");
    expect(nodeState(result, "wallet-requester")).toBe("done");
    expect(nodeState(result, "wallet-treasury")).toBe("active");
    expect(nodeState(result, "stage-funded")).toBe("done");
  });

  it("claimed: worker node active, payout edge not yet animated", () => {
    const result = build({ job: job("claimed"), payment: payment("settled") });
    expect(nodeState(result, "wallet-worker")).toBe("active");
    expect(edge(result, "payout-edge").animated).toBe(false);
    expect(nodeState(result, "stage-working")).toBe("active");
  });

  it("delivered: payout edge animates (payout imminent)", () => {
    const result = build({ job: job("delivered"), payment: payment("settled") });
    expect(edge(result, "payout-edge").animated).toBe(true);
  });

  it("paid: everything done, nothing animated", () => {
    const result = build({ job: job("paid"), payment: payment("settled") });
    expect(edge(result, "escrow-edge").animated).toBe(false);
    expect(edge(result, "payout-edge").animated).toBe(false);
    expect(edge(result, "payout-edge").label).toBe("worker paid");
    for (const id of ["wallet-requester", "wallet-treasury", "wallet-worker"]) {
      expect(nodeState(result, id)).toBe("done");
    }
    expect(nodeState(result, "stage-paid")).toBe("done");
  });

  it("expert path maps onto the same lanes (launched ≈ claimed)", () => {
    const result = build({ job: job("launched"), payment: payment("settled") });
    expect(nodeState(result, "wallet-worker")).toBe("active");
    expect(nodeState(result, "stage-working")).toBe("active");
  });

  it("carries live balances onto the treasury node", () => {
    const result = build();
    const treasuryNode = result.nodes.find((n) => n.id === "wallet-treasury");
    expect(treasuryNode?.data.balances).toEqual({ eth: "0.1", usdc: "3.25" });
  });

  it("intake with no payment leaves the wallet lane idle", () => {
    const result = build({
      job: job("intake"),
      payment: null,
      requesterAddress: undefined,
    });
    expect(nodeState(result, "stage-intake")).toBe("active");
    expect(nodeState(result, "wallet-requester")).toBe("idle");
    expect(edge(result, "escrow-edge").animated).toBe(false);
  });
});
