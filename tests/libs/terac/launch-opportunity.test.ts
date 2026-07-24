import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { launchOpportunity } from "@/libs/terac";

const fetchMock = vi.fn();

beforeEach(() => {
  process.env.TERAC_API_KEY = "test-key";
  delete process.env.TERAC_API_BASE_URL;
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ id: "opp_1", status: "live" }),
    text: async () => "",
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe("launchOpportunity", () => {
  it("POSTs to the launch endpoint with no body", async () => {
    const result = await launchOpportunity("opp_1");

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(
      "https://terac.com/api/external/v2/opportunities/opp_1/launch"
    );
    expect(init.method).toBe("POST");
    expect(init.body).toBeUndefined();
    expect(result.status).toBe("live");
  });
});
