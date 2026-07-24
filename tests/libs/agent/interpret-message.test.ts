import { describe, expect, it } from "vitest";
import { AGENT_INTENT, interpretMessage } from "@/libs/agent";

describe("interpretMessage", () => {
  it.each(["yes", "YES", "Yes!", "launch it", "go ahead", "confirm", "approve", "sounds good"])(
    "reads %s as affirm",
    (text) => {
      expect(interpretMessage(text)).toBe(AGENT_INTENT.affirm);
    }
  );

  it.each(["no", "Nope", "cancel", "not yet", "reject", "hold off"])(
    "reads %s as decline",
    (text) => {
      expect(interpretMessage(text)).toBe(AGENT_INTENT.decline);
    }
  );

  it.each(["status?", "any update on this", "how's it going", "what's the progress"])(
    "reads %s as status",
    (text) => {
      expect(interpretMessage(text)).toBe(AGENT_INTENT.status);
    }
  );

  it("treats a job description as freeform", () => {
    expect(
      interpretMessage("I need a designer to redo my landing page by Friday")
    ).toBe(AGENT_INTENT.freeform);
  });

  it("does not read 'yesterday' as affirm", () => {
    expect(interpretMessage("yesterday's meeting notes need cleanup")).toBe(
      AGENT_INTENT.freeform
    );
  });
});
