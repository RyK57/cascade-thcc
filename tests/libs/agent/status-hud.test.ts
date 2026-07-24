import { describe, expect, it } from "vitest";
import { HUD_STAGE } from "@/libs/agent/status-hud";

describe("HUD_STAGE", () => {
  it("covers quote through paid plus expert stages", () => {
    expect(HUD_STAGE.quoted).toBe("quoted");
    expect(HUD_STAGE.funded).toBe("funded");
    expect(HUD_STAGE.claimed).toBe("claimed");
    expect(HUD_STAGE.delivered).toBe("delivered");
    expect(HUD_STAGE.paid).toBe("paid");
    expect(HUD_STAGE.launched).toBe("launched");
    expect(HUD_STAGE.inReview).toBe("in_review");
    expect(HUD_STAGE.answered).toBe("answered");
  });
});
