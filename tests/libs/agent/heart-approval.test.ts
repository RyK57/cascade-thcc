import { beforeEach, describe, expect, it, vi } from "vitest";

const claimJobApproval = vi.fn();
const updateJob = vi.fn();
const getPaymentByJobId = vi.fn();
const updatePaymentStatus = vi.fn();
const adjustCredits = vi.fn();
const upsertUserByPhone = vi.fn();
const broadcastJobToPeers = vi.fn();

vi.mock("@/db/jobs", () => ({
  APPROVAL_SOURCE: { reaction: "imessage_reaction", message: "imessage_message", web: "web" },
  claimJobApproval: (...a: unknown[]) => claimJobApproval(...a),
  updateJob: (...a: unknown[]) => updateJob(...a),
  claimJob: vi.fn(),
  clearAssigneeAndReopen: vi.fn(),
}));

vi.mock("@/db/payments", () => ({
  claimEscrowRelease: vi.fn(),
  createPayment: vi.fn(),
  getPaymentByJobId: (...a: unknown[]) => getPaymentByJobId(...a),
  updatePayment: vi.fn(),
  updatePaymentStatus: (...a: unknown[]) => updatePaymentStatus(...a),
}));

vi.mock("@/db/users", () => ({
  adjustCredits: (...a: unknown[]) => adjustCredits(...a),
  getUserByIdAdmin: vi.fn(),
  getUserByPhone: vi.fn(async () => null),
  listPeers: vi.fn(async () => []),
  upsertUserByPhone: (...a: unknown[]) => upsertUserByPhone(...a),
}));

vi.mock("@/db/bids", () => ({
  listJobBids: vi.fn(async () => []),
  upsertJobBid: vi.fn(),
  secondPriceClear: vi.fn(() => null),
}));

vi.mock("@/db/payouts", () => ({
  createPayout: vi.fn(),
  getPayoutByJobId: vi.fn(async () => null),
}));

vi.mock("@/libs/agent/broadcast-peers", () => ({
  broadcastJobToPeers: (...a: unknown[]) => broadcastJobToPeers(...a),
}));

vi.mock("@/libs/agent/status-hud", () => ({
  HUD_STAGE: { quoted: "quoted", funded: "funded", paymentPending: "payment_pending" },
  syncJobHud: vi.fn(async (job: unknown) => job),
}));

vi.mock("@/libs/linq", () => ({
  sendChatMessage: vi.fn(),
  sendTextMessage: vi.fn(),
  isLinqConfigured: vi.fn(() => false),
}));

vi.mock("@/libs/linq/payment-requests", () => ({
  createAgentPayRequest: vi.fn(),
  sendCheckoutLink: vi.fn(),
}));

vi.mock("@/libs/dynamic/treasury", () => ({
  ensureSandboxTreasury: vi.fn(async () => ({
    address: "0x9999999999999999999999999999999999999999",
  })),
  payoutFromTreasury: vi.fn(),
}));

vi.mock("@/libs/dynamic/agent-wallet", () => ({
  getAgentWalletAddress: vi.fn(() => "0xAgent00000000000000000000000000000000001"),
  isAgentWalletConfigured: vi.fn(() => true),
}));

vi.mock("@/libs/dynamic/phone-wallet", () => ({
  ensurePhoneWallet: vi.fn(async (phone: string) => ({ phone, creditBalance: 0 })),
}));

vi.mock("@/libs/chain", () => ({
  buildPaymentQuote: vi.fn(async () => ({ asset: "usdc", amountCents: 1200 })),
  quoteLine: vi.fn(() => "12.00 USDC"),
}));

vi.mock("@/libs/account/job-pay-link", () => ({
  jobPayLink: vi.fn(async () => "https://cascade.example.com/l/tok"),
}));

import { handlePeerTurn } from "@/libs/agent/handle-peer-turn";
import { AGENT_ACTION, AGENT_INTENT } from "@/libs/agent/types";
import { JOB_STATUS, type Job } from "@/utils/schema/job";
import { PAYMENT_STATUS } from "@/utils/schema/payment";

const JOB_ID = "22222222-2222-4222-8222-222222222222";
const PHONE = "+15555550999";

function quotedJob(overrides: Partial<Job> = {}): Job {
  return {
    id: JOB_ID,
    linqChatId: "chat_1",
    requesterHandle: PHONE,
    title: "Test my signup flow",
    status: JOB_STATUS.quoted,
    tier: "peer",
    priceUsdCents: 1200,
    createdAt: "2026-07-24T00:00:00.000Z",
    updatedAt: "2026-07-24T00:00:00.000Z",
    ...overrides,
  };
}

/** A heart tapback arrives as an affirm intent. */
function heartTurn(job: Job) {
  return {
    job,
    intent: AGENT_INTENT.affirm,
    text: "yes",
    senderHandle: PHONE,
    chatId: "chat_1",
    isNewJob: false,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  claimJobApproval.mockResolvedValue(quotedJob());
  updateJob.mockImplementation(async (_id, input) => quotedJob(input as Partial<Job>));
  getPaymentByJobId.mockResolvedValue({
    id: "pay_1",
    jobId: JOB_ID,
    amountCents: 1200,
    asset: "usdc",
    status: PAYMENT_STATUS.pending,
  });
  upsertUserByPhone.mockResolvedValue({ id: "user_1", creditBalance: 0 });
  updatePaymentStatus.mockResolvedValue(undefined);
  adjustCredits.mockResolvedValue(undefined);
});

describe("heart reaction on a quote", () => {
  it("records the approval against the job", async () => {
    await handlePeerTurn(heartTurn(quotedJob()));

    expect(claimJobApproval).toHaveBeenCalledWith({
      jobId: JOB_ID,
      source: "imessage_reaction",
    });
  });

  it("charges the balance and starts the job in one step", async () => {
    upsertUserByPhone.mockResolvedValue({ id: "user_1", creditBalance: 50 });

    const outcome = await handlePeerTurn(heartTurn(quotedJob()));

    expect(adjustCredits).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user_1", deltaCredits: -12 })
    );
    expect(updatePaymentStatus).toHaveBeenCalledWith("pay_1", PAYMENT_STATUS.settled);
    expect(broadcastJobToPeers).toHaveBeenCalled();
    expect(outcome.action).toBe(AGENT_ACTION.funded);
  });

  it("never charges twice for a repeated reaction", async () => {
    // The second heart loses the compare-and-set on approved_at.
    claimJobApproval.mockResolvedValue(null);
    upsertUserByPhone.mockResolvedValue({ id: "user_1", creditBalance: 50 });

    const outcome = await handlePeerTurn(heartTurn(quotedJob()));

    expect(adjustCredits).not.toHaveBeenCalled();
    expect(broadcastJobToPeers).not.toHaveBeenCalled();
    expect(outcome.action).toBe(AGENT_ACTION.paymentPending);
  });

  it("reports the settled state when an already-approved job was paid", async () => {
    claimJobApproval.mockResolvedValue(null);
    getPaymentByJobId.mockResolvedValue({
      id: "pay_1",
      jobId: JOB_ID,
      amountCents: 1200,
      asset: "usdc",
      status: PAYMENT_STATUS.settled,
    });

    const outcome = await handlePeerTurn(heartTurn(quotedJob()));

    expect(adjustCredits).not.toHaveBeenCalled();
    expect(outcome.action).toBe(AGENT_ACTION.funded);
  });

  it("asks for payment with real instructions when there is no balance", async () => {
    const outcome = await handlePeerTurn(heartTurn(quotedJob()));

    expect(adjustCredits).not.toHaveBeenCalled();
    expect(outcome.action).toBe(AGENT_ACTION.paymentPending);
    // Amount, destination, network and a link — not just "pay please".
    expect(outcome.reply).toContain("12.00 USDC");
    expect(outcome.reply).toContain("0xAgent00000000000000000000000000000000001");
    expect(outcome.reply).toContain("Base Sepolia");
    expect(outcome.reply).toContain("https://cascade.example.com/l/tok");
  });
});
