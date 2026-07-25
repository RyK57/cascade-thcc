import { beforeEach, describe, expect, it, vi } from "vitest";

const updatePaymentStatus = vi.fn();
const updatePayment = vi.fn();
const getJobById = vi.fn();
const updateJob = vi.fn();
const syncJobHud = vi.fn(async (job: unknown) => job);
const sendChatMessage = vi.fn();
const recordJobMessage = vi.fn();
const isLinqConfigured = vi.fn(() => true);

vi.mock("@/db/payments", () => ({
  updatePaymentStatus: (...args: unknown[]) => updatePaymentStatus(...args),
  updatePayment: (...args: unknown[]) => updatePayment(...args),
}));

vi.mock("@/db/jobs", () => ({
  getJobById: (...args: unknown[]) => getJobById(...args),
  updateJob: (...args: unknown[]) => updateJob(...args),
  recordJobMessage: (...args: unknown[]) => recordJobMessage(...args),
  MESSAGE_DIRECTION: { outbound: "outbound", inbound: "inbound" },
}));

vi.mock("@/libs/linq", () => ({
  isLinqConfigured: () => isLinqConfigured(),
  sendChatMessage: (...args: unknown[]) => sendChatMessage(...args),
}));

vi.mock("@/libs/agent/status-hud", () => ({
  HUD_STAGE: { paid: "paid", funded: "funded" },
  syncJobHud: (...args: unknown[]) => syncJobHud(...args),
}));

vi.mock("@/libs/agent/handle-peer-turn", () => ({
  markPeerFunded: vi.fn(),
}));

import { settlePayment } from "@/libs/agent/settle-payment";
import { JOB_STATUS, JOB_TIER } from "@/utils/schema";
import { PAYMENT_STATUS } from "@/utils/schema/payment";

describe("settlePayment worker receipt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updatePaymentStatus.mockResolvedValue({
      id: "pay_1",
      jobId: "job_1",
      status: PAYMENT_STATUS.settled,
      escrowTxHash: "0xescrow",
      escrowHeldAt: "2026-07-24T00:00:00.000Z",
    });
    updatePayment.mockImplementation(async (_id: string, patch: object) => ({
      id: "pay_1",
      jobId: "job_1",
      status: PAYMENT_STATUS.settled,
      escrowTxHash: "0xescrow",
      escrowHeldAt: "2026-07-24T00:00:00.000Z",
      ...patch,
    }));
    getJobById.mockResolvedValue({
      id: "job_1",
      linqChatId: "chat_1",
      status: JOB_STATUS.paymentPending,
      tier: JOB_TIER.expert,
      title: "Expert job",
    });
    updateJob.mockResolvedValue({
      id: "job_1",
      linqChatId: "chat_1",
      status: JOB_STATUS.paid,
      tier: JOB_TIER.expert,
      title: "Expert job",
    });
    sendChatMessage.mockResolvedValue({ message: { id: "m1" } });
  });

  it("links the worker payout hash in the paid reply, not the escrow fund hash", async () => {
    await settlePayment({
      paymentId: "pay_1",
      status: PAYMENT_STATUS.settled,
      workerPaid: true,
      workerTxHash: "0xworkerpay",
    });

    expect(sendChatMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining("0xworkerpay"),
      })
    );
    expect(sendChatMessage.mock.calls[0]?.[0]?.text).not.toContain("0xescrow");
  });
});
