import { afterEach, describe, expect, it } from "vitest";
import { heuristicTriage, triageJob } from "@/libs/agent/triage";

const ORIGINAL_KEY = process.env.ANTHROPIC_API_KEY;

afterEach(() => {
  if (ORIGINAL_KEY === undefined) delete process.env.ANTHROPIC_API_KEY;
  else process.env.ANTHROPIC_API_KEY = ORIGINAL_KEY;
});

describe("heuristicTriage", () => {
  it("routes planning to ai without clarifying", () => {
    const result = heuristicTriage("Plan my week around Startup School");
    expect(result.tier).toBe("ai");
    expect(result.needsClarification).toBe(false);
  });

  it("routes phone signup checks to peer", () => {
    const result = heuristicTriage(
      "Can you have someone text my signup on a real phone. This number, 99999 is code"
    );
    expect(result.tier).toBe("peer");
    expect(result.needsClarification).toBe(false);
  });

  it("routes mid-thread task switches to peer", () => {
    const result = heuristicTriage(
      "Actually disregard. New task. Have someone test my signup on a real phone"
    );
    expect(result.tier).toBe("peer");
    expect(result.needsClarification).toBe(false);
  });
});

describe("explicit human requests", () => {
  it("routes 'someone to review my poem' to peer, not ai", () => {
    const result = heuristicTriage(
      "I just need someone to tell me if my poem is good"
    );
    expect(result.tier).toBe("peer");
  });

  it("routes 'have somebody check this' to peer", () => {
    const result = heuristicTriage("Can somebody check this for me");
    expect(result.tier).toBe("peer");
  });
});

describe("triageJob clarification cap", () => {
  it("forces a route after one clarification even if model would ask again", async () => {
    delete process.env.ANTHROPIC_API_KEY;

    const result = await triageJob({
      text: "Sci fi",
      priorContext: "Plan my week…\nUser: Advice\nUser: Getting VC funding",
      alreadyClarified: true,
    });

    expect(result.needsClarification).toBe(false);
    expect(result.tier).toBe("ai");
  });
});
