import { beforeEach, describe, expect, it, vi } from "vitest";

type MockSupabase = { auth: { getUser: typeof getUser } } | null;

const getUser = vi.fn();
const createClient = vi.fn(
  async (): Promise<MockSupabase> => ({ auth: { getUser } })
);

vi.mock("@/utils/supabase/server", () => ({
  createClient: () => createClient(),
}));

import { authorizeInternalRequest } from "@/components/app/internal/authorize-internal-request";

describe("authorizeInternalRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.CRON_SECRET;
    delete process.env.INTERNAL_OPERATOR_EMAILS;
    // NODE_ENV is readonly on the typed process.env — stubEnv writes it safely
    // and is restored by vitest between files.
    vi.stubEnv("NODE_ENV", "test");
  });

  it("allows a matching CRON_SECRET bearer token", async () => {
    process.env.CRON_SECRET = "ops-secret";
    const request = new Request("http://localhost/api/internal/demo-metrics", {
      headers: { authorization: "Bearer ops-secret" },
    });

    await expect(authorizeInternalRequest(request)).resolves.toBe(true);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("allows a signed-in operator on the allowlist", async () => {
    process.env.INTERNAL_OPERATOR_EMAILS = "ops@example.com";
    getUser.mockResolvedValue({ data: { user: { email: "ops@example.com" } } });

    const request = new Request("http://localhost/api/internal/seed-demo-job", {
      method: "POST",
    });

    await expect(authorizeInternalRequest(request)).resolves.toBe(true);
  });

  it("denies an unsigned request when an allowlist is set", async () => {
    process.env.INTERNAL_OPERATOR_EMAILS = "ops@example.com";
    getUser.mockResolvedValue({ data: { user: null } });

    const request = new Request("http://localhost/api/internal/seed-demo-job", {
      method: "POST",
    });

    await expect(authorizeInternalRequest(request)).resolves.toBe(false);
  });

  it("denies when supabase client is unavailable", async () => {
    process.env.INTERNAL_OPERATOR_EMAILS = "ops@example.com";
    createClient.mockResolvedValueOnce(null);

    const request = new Request("http://localhost/api/internal/demo-metrics");
    await expect(authorizeInternalRequest(request)).resolves.toBe(false);
  });
});
