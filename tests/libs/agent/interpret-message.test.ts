import { describe, expect, it } from "vitest";
import { AGENT_INTENT, interpretMessage } from "@/libs/agent";
import { interpretPayAsset } from "@/libs/agent/interpret-message";

describe("interpretMessage", () => {
  it.each([
    "yes",
    "YES",
    "Yes!",
    "launch it",
    "go ahead",
    "confirm",
    "approve",
    "sounds good",
    "claim",
  ])("reads %s as affirm", (text) => {
    expect(interpretMessage(text)).toBe(AGENT_INTENT.affirm);
  });

  // "no" rejects whatever was just offered; it must not end the job. Only the
  // explicit stop words do that.
  it.each(["no", "Nope", "not yet", "reject", "hold off", "don't"])(
    "reads %s as decline",
    (text) => {
      expect(interpretMessage(text)).toBe(AGENT_INTENT.decline);
    }
  );

  it.each([
    "stop",
    "STOP",
    "Stop.",
    "cancel",
    "cancel it",
    "cancel the job",
    "abort",
    "never mind",
    "nevermind",
    "forget it",
  ])("reads %s as stop", (text) => {
    expect(interpretMessage(text)).toBe(AGENT_INTENT.stop);
  });

  it("does not read a task that merely mentions stopping as stop", () => {
    expect(interpretMessage("find me someone to stop the leak")).toBe(
      AGENT_INTENT.freeform
    );
    expect(interpretMessage("cancel my gym membership for me")).toBe(
      AGENT_INTENT.freeform
    );
  });

  it.each([
    "status?",
    "any update on this",
    "how's it going",
    "what's the progress",
  ])("reads %s as status", (text) => {
    expect(interpretMessage(text)).toBe(AGENT_INTENT.status);
  });

  it("detects pay with credits", () => {
    expect(interpretMessage("pay with credits")).toBe(AGENT_INTENT.payCredits);
  });

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

describe("interpretPayAsset", () => {
  it("picks up an explicit ETH request", () => {
    expect(interpretPayAsset("pay in eth")).toBe("eth");
    expect(interpretPayAsset("Yes, pay with ethereum")).toBe("eth");
  });

  it("picks up an explicit stablecoin request", () => {
    expect(interpretPayAsset("pay in usdc")).toBe("usdc");
    expect(interpretPayAsset("use stablecoin")).toBe("usdc");
  });

  it("returns null when the requester didn't say", () => {
    expect(interpretPayAsset("yes")).toBeNull();
    expect(interpretPayAsset("find me a plumber")).toBeNull();
  });
});

describe("pay-from-balance intent", () => {
  it("accepts both the balance and the legacy credits wording", () => {
    expect(interpretMessage("pay with balance")).toBe(AGENT_INTENT.payCredits);
    expect(interpretMessage("pay with credits")).toBe(AGENT_INTENT.payCredits);
  });
});
