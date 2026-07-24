import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { reviewSubmission } from "@/libs/terac";

const fetchMock = vi.fn();

beforeEach(() => {
  process.env.TERAC_API_KEY = "test-key";
  delete process.env.TERAC_API_BASE_URL;
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ id: "sub_1", status: "approved" }),
    text: async () => "",
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe("reviewSubmission", () => {
  it("POSTs approvals to the approve endpoint", async () => {
    await reviewSubmission({ submissionId: "sub_1", decision: "approve" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(
      "https://terac.com/api/external/v2/submissions/sub_1/approve"
    );
    expect(init.method).toBe("POST");
  });

  it("POSTs rejections to the reject endpoint", async () => {
    await reviewSubmission({ submissionId: "sub_2", decision: "reject" });

    expect(String(fetchMock.mock.calls[0][0])).toBe(
      "https://terac.com/api/external/v2/submissions/sub_2/reject"
    );
  });
});
