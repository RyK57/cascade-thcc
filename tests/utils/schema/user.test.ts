import { describe, expect, it } from "vitest";
import { createUserSchema } from "@/utils/schema/user";

describe("createUserSchema", () => {
  it("accepts valid email input", () => {
    const result = createUserSchema.safeParse({
      email: "test@example.com",
      fullName: "Test User",
    });
    expect(result.success).toBe(true);
  });
});
