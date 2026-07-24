import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { listSubmissions } from "@/libs/terac";

const fetchMock = vi.fn();

beforeEach(() => {
  process.env.TERAC_API_KEY = "test-key";
  delete process.env.TERAC_API_BASE_URL;
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ data: [], pagination: { has_more: false } }),
    text: async () => "",
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe("listSubmissions", () => {
  it("GETs the opportunity submissions with query filters", async () => {
    await listSubmissions({
      opportunityId: "opp_1",
      limit: 10,
      status: "awaiting_review",
    });

    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.pathname).toBe(
      "/api/external/v2/opportunities/opp_1/submissions"
    );
    expect(url.searchParams.get("limit")).toBe("10");
    expect(url.searchParams.get("status")).toBe("awaiting_review");
    expect(url.searchParams.has("cursor")).toBe(false);
  });
});
