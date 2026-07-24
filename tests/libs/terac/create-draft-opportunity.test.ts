import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDraftOpportunity } from "@/libs/terac";

const fetchMock = vi.fn();

function jsonResponse(payload: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => payload,
    text: async () => JSON.stringify(payload),
  };
}

beforeEach(() => {
  process.env.TERAC_API_KEY = "test-key";
  delete process.env.TERAC_API_BASE_URL;
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockResolvedValue(jsonResponse({ id: "opp_1", status: "draft" }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe("createDraftOpportunity", () => {
  it("POSTs a snake_case body to /opportunities", async () => {
    await createDraftOpportunity({
      title: "Review my pitch deck",
      projectId: "proj_1",
      numParticipants: 2,
      businessType: "b2c",
      description: "Need a VC-experienced reviewer",
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://terac.com/api/external/v2/opportunities");
    expect(init.method).toBe("POST");

    const body = JSON.parse(init.body);
    expect(body.title).toBe("Review my pitch deck");
    expect(body.project_id).toBe("proj_1");
    expect(body.num_participants).toBe(2);
    expect(body.business_type).toBe("b2c");
    expect(body.description).toBe("Need a VC-experienced reviewer");
  });

  it("fills in a default task when none is given", async () => {
    await createDraftOpportunity({
      title: "Job",
      projectId: "proj_1",
      numParticipants: 1,
      businessType: "b2c",
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.tasks).toHaveLength(1);
    expect(body.tasks[0].sequence).toBe(1);
    expect(body.tasks[0].duration_minutes).toBeGreaterThan(0);
  });

  it("returns the parsed opportunity", async () => {
    const result = await createDraftOpportunity({
      title: "Job",
      projectId: "proj_1",
      numParticipants: 1,
      businessType: "b2c",
    });
    expect(result).toEqual({ id: "opp_1", status: "draft" });
  });
});
