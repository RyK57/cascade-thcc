import { describe, expect, it } from "vitest";
import {
  createJobSchema,
  JOB_STATUS,
  jobSchema,
  updateJobSchema,
} from "@/utils/schema/job";

const validJob = {
  id: "0b9f8e3c-1c3f-4d21-9a5e-3f3a2b1c0d9e",
  linqChatId: "chat_123",
  requesterHandle: "+15555550123",
  title: "Find a pitch deck reviewer",
  status: JOB_STATUS.intake,
  createdAt: "2026-07-24T00:00:00.000Z",
  updatedAt: "2026-07-24T00:00:00.000Z",
};

describe("jobSchema", () => {
  it("accepts a minimal job", () => {
    expect(jobSchema.parse(validJob)).toMatchObject({
      linqChatId: "chat_123",
      status: "intake",
    });
  });

  it("rejects unknown statuses", () => {
    expect(() =>
      jobSchema.parse({ ...validJob, status: "negotiating" })
    ).toThrow();
  });
});

describe("createJobSchema", () => {
  it("requires chat, requester, and title", () => {
    expect(() =>
      createJobSchema.parse({ linqChatId: "chat_123" })
    ).toThrow();

    expect(
      createJobSchema.parse({
        linqChatId: "chat_123",
        requesterHandle: "+15555550123",
        title: "Job",
      })
    ).toMatchObject({ title: "Job" });
  });
});

describe("updateJobSchema", () => {
  it("allows partial updates", () => {
    expect(
      updateJobSchema.parse({ status: JOB_STATUS.launched })
    ).toEqual({ status: "launched" });
  });
});
