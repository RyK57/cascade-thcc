import { describe, expect, it } from "vitest";
import { getMessagesStatus } from "@/components/app/main/imessage-handoff";

describe("getMessagesStatus", () => {
  it("marks a verified phone session as linked without a public Linq number", () => {
    expect(getMessagesStatus(null, "+15555550100")).toBe("Linked");
  });

  it("shows a configured Linq number as live for signed-out visitors", () => {
    expect(getMessagesStatus("+15555550199")).toBe("Live");
  });

  it("is unavailable only when neither channel signal exists", () => {
    expect(getMessagesStatus(null)).toBe("Unavailable");
  });
});
