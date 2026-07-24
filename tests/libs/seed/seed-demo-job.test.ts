import { beforeEach, describe, expect, it, vi } from "vitest";

const { createJob, updateJob, createPayment } = vi.hoisted(() => ({
  createJob: vi.fn(),
  updateJob: vi.fn(),
  createPayment: vi.fn(),
}));

vi.mock("@/db/jobs", () => ({ createJob, updateJob }));
vi.mock("@/db/payments", () => ({ createPayment }));

import { seedDemoJob } from "@/libs/seed/seed-demo-job";

const JOB_ID = "11111111-1111-4111-8111-111111111111";

beforeEach(() => {
  createJob.mockReset().mockResolvedValue({ id: JOB_ID });
  updateJob
    .mockReset()
    .mockImplementation(async (_id: string, input: Record<string, unknown>) => ({
      id: JOB_ID,
      ...input,
    }));
  createPayment
    .mockReset()
    .mockImplementation(async (input: Record<string, unknown>) => ({
      id: "pay_1",
      ...input,
    }));
});

describe("seedDemoJob", () => {
  it("creates a payment_pending job with a matching payment row", async () => {
    const result = await seedDemoJob();

    expect(updateJob).toHaveBeenCalledWith(JOB_ID, {
      status: "payment_pending",
      quotedTotalCents: 300,
      quotedCurrency: "usd",
    });
    expect(createPayment).toHaveBeenCalledWith({
      jobId: JOB_ID,
      amountCents: 300,
      currency: "usd",
    });
    expect(result.payUrl).toContain(`/main?job=${JOB_ID}`);
  });

  it("respects a custom amount", async () => {
    await seedDemoJob({ amountCents: 500 });
    expect(createPayment).toHaveBeenCalledWith(
      expect.objectContaining({ amountCents: 500 })
    );
  });

  it("uses a unique demo chat id per seed", async () => {
    await seedDemoJob();
    await seedDemoJob();
    const [first, second] = createJob.mock.calls.map(
      (call) => (call[0] as { linqChatId: string }).linqChatId
    );
    expect(first).toMatch(/^demo_/);
    expect(first).not.toBe(second);
  });
});
