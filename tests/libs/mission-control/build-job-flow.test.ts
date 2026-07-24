import { describe, expect, it } from "vitest";
import { buildJobFlow } from "@/libs/mission-control";
import type { MissionFlowInput } from "@/libs/mission-control";
import type { Job } from "@/utils/schema/job";
import type { Payment } from "@/utils/schema/payment";

const AGENT = "0x2222222222222222222222222222222222222222";
const WORKER = "0x3333333333333333333333333333333333333333";
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
    job: job("payment_pending"),
    payment: payment("payment_pending"),
    agentAddress: AGENT,
    workerAddress: WORKER,
    requesterAddress: REQUESTER,
    balances: { [AGENT]: { eth: "0.1", usdc: "0" } },
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

describe("buildJobFlow", () => {
  it("renders 7 nodes and 5 edges", () => {
    const result = build();
    expect(result.nodes).toHaveLength(7);
    expect(result.edges).toHaveLength(5);
  });

  it("payment_pending: escrow edge animates, payout idle", () => {
    const result = build();
    expect(edge(result, "escrow-edge").animated).toBe(true);
    expect(edge(result, "payout-edge").animated).toBe(false);
    expect(nodeState(result, "wallet-requester")).toBe("active");
  });

  it("authorized (escrow held): escrow done, agent active, payout idle", () => {
    const result = build({ payment: payment("authorized") });
    expect(edge(result, "escrow-edge").animated).toBe(false);
    expect(edge(result, "escrow-edge").label).toBe("escrow held");
    expect(edge(result, "payout-edge").label).toBe("release on approve");
    expect(nodeState(result, "wallet-requester")).toBe("done");
    expect(nodeState(result, "wallet-agent")).toBe("active");
    expect(nodeState(result, "wallet-worker")).toBe("idle");
  });

  it("isPayingOut: payout edge animates", () => {
    const result = build({ payment: payment("authorized"), isPayingOut: true });
    expect(edge(result, "payout-edge").animated).toBe(true);
    expect(nodeState(result, "wallet-worker")).toBe("active");
  });

  it("settled escrow alone does not mark worker paid", () => {
    const result = build({
      job: job("funded"),
      payment: payment("settled"),
    });
    expect(edge(result, "escrow-edge").label).toBe("escrow held");
    expect(edge(result, "payout-edge").label).toBe("release on approve");
    expect(nodeState(result, "wallet-worker")).toBe("idle");
    expect(nodeState(result, "stage-paid")).not.toBe("done");
  });

  it("job paid: everything done, nothing animated", () => {
    const result = build({ job: job("paid"), payment: payment("settled") });
    expect(edge(result, "escrow-edge").animated).toBe(false);
    expect(edge(result, "payout-edge").animated).toBe(false);
    expect(edge(result, "payout-edge").label).toBe("worker paid");
    for (const id of ["wallet-requester", "wallet-agent", "wallet-worker"]) {
      expect(nodeState(result, id)).toBe("done");
    }
    expect(nodeState(result, "stage-paid")).toBe("done");
  });

  it("peer tier uses claim-shaped stage labels", () => {
    const result = build({
      job: { ...job("claimed"), tier: "peer" },
      payment: payment("settled"),
    });
    expect(result.nodes.find((n) => n.id === "stage-terac")?.data.title).toBe(
      "Quoted / fund"
    );
    expect(result.nodes.find((n) => n.id === "stage-review")?.data.title).toBe(
      "Claimed work"
    );
  });

  it("tx hashes become truncated edge labels with BaseScan links", () => {
    const hash = "0xabcdef0123456789";
    const result = build({ escrowTxHash: hash });
    const escrowEdge = edge(result, "escrow-edge");
    expect(escrowEdge.label).toBe("0xabcdef01…");
    expect((escrowEdge.data as { txUrl: string }).txUrl).toContain(
      "sepolia.basescan.org/tx/"
    );
  });

  it("carries live balances onto wallet nodes", () => {
    const result = build();
    const agentNode = result.nodes.find((n) => n.id === "wallet-agent");
    expect(agentNode?.data.balances).toEqual({ eth: "0.1", usdc: "0" });
  });

  it("early job statuses leave wallet lane idle", () => {
    const result = build({ job: job("intake"), payment: null, requesterAddress: undefined });
    expect(nodeState(result, "stage-intake")).toBe("active");
    expect(nodeState(result, "wallet-requester")).toBe("idle");
    expect(edge(result, "escrow-edge").animated).toBe(false);
  });
});
