import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The ask-share-continue loop through the real webhook handler: the agent
 * requested location, the person tapped Share in Messages (sending no text),
 * and the webhook must both persist the coords and run a turn so the thread
 * picks back up instead of going silent.
 */

const getJobByChatId = vi.fn();
const updateJob = vi.fn();
const upsertUserByPhone = vi.fn();
const retrieveLocation = vi.fn();
const runAgentTurn = vi.fn();

vi.mock("@/db/jobs", () => ({
  getJobByChatId: (...args: unknown[]) => getJobByChatId(...args),
  updateJob: (...args: unknown[]) => updateJob(...args),
}));

vi.mock("@/db/payments", () => ({
  getPaymentByJobId: vi.fn(),
}));

vi.mock("@/db/users", () => ({
  upsertUserByPhone: (...args: unknown[]) => upsertUserByPhone(...args),
}));

vi.mock("@/libs/agent", () => ({
  runAgentTurn: (...args: unknown[]) => runAgentTurn(...args),
  settlePayment: vi.fn(),
}));

vi.mock("@/libs/linq", () => ({
  isLinqConfigured: () => true,
  unwrapLinqEvent: (body: string) => JSON.parse(body),
  parseInboundEvent: () => null,
  retrieveLocation: (...args: unknown[]) => retrieveLocation(...args),
}));

vi.mock("@/utils/supabase/admin", () => ({
  isSupabaseAdminConfigured: () => true,
}));

import { POST } from "@/app/api/linq/webhook/route";

const CHAT_ID = "chat_1";
const PHONE = "+15122263512";

function locationEvent(eventType: string): Request {
  return new Request("https://cascade.test/api/linq/webhook", {
    method: "POST",
    body: JSON.stringify({
      event_type: eventType,
      data: { chat_id: CHAT_ID },
    }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  retrieveLocation.mockResolvedValue({ lat: 30.28265, lng: -97.73921 });
  getJobByChatId.mockResolvedValue({
    id: "job_1",
    requesterHandle: PHONE,
  });
  runAgentTurn.mockResolvedValue({ action: "answered", jobId: "job_1" });
});

describe("location share webhook", () => {
  it("persists the share and continues the conversation", async () => {
    const response = await POST(locationEvent("location.sharing.started"));

    expect(response.status).toBe(200);
    expect(updateJob).toHaveBeenCalledWith("job_1", {
      requesterLat: 30.28265,
      requesterLng: -97.73921,
    });
    expect(upsertUserByPhone).toHaveBeenCalledWith(
      expect.objectContaining({
        phone: PHONE,
        lastLat: 30.28265,
        lastLng: -97.73921,
      })
    );

    // The share was the person's whole reply — the agent must answer it.
    expect(runAgentTurn).toHaveBeenCalledTimes(1);
    expect(runAgentTurn).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "text",
        chatId: CHAT_ID,
        senderHandle: PHONE,
        text: "[Shared my location]",
      })
    );
  });

  it("refreshes coords without a second turn once the job has them", async () => {
    // Live shares stream location.sharing.updated events; only the share
    // that unblocked the job deserves a reply.
    getJobByChatId.mockResolvedValue({
      id: "job_1",
      requesterHandle: PHONE,
      requesterLat: 30.0,
      requesterLng: -97.0,
    });

    const response = await POST(locationEvent("location.sharing.updated"));

    expect(response.status).toBe(200);
    expect(updateJob).toHaveBeenCalled();
    expect(runAgentTurn).not.toHaveBeenCalled();
  });

  it("ignores a stopped share entirely", async () => {
    const response = await POST(locationEvent("location.sharing.stopped"));

    expect(response.status).toBe(200);
    expect(retrieveLocation).not.toHaveBeenCalled();
    expect(updateJob).not.toHaveBeenCalled();
    expect(runAgentTurn).not.toHaveBeenCalled();
  });

  it("does nothing for a chat with no job", async () => {
    getJobByChatId.mockResolvedValue(null);

    const response = await POST(locationEvent("location.sharing.started"));

    expect(response.status).toBe(200);
    expect(updateJob).not.toHaveBeenCalled();
    expect(runAgentTurn).not.toHaveBeenCalled();
  });

  it("still answers 200 when the follow-up turn fails", async () => {
    // Coords are saved; a Linq retry cannot improve a failed LLM turn and
    // would re-run the whole handler.
    runAgentTurn.mockRejectedValue(new Error("model down"));

    const response = await POST(locationEvent("location.sharing.started"));

    expect(response.status).toBe(200);
    expect(updateJob).toHaveBeenCalled();
  });
});
