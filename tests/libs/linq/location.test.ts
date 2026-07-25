import { beforeEach, describe, expect, it, vi } from "vitest";

const locationRetrieve = vi.fn();

vi.mock("@/libs/linq/client", () => ({
  createLinqClient: () => ({
    chats: {
      location: {
        request: vi.fn(),
        retrieve: (...args: unknown[]) => locationRetrieve(...args),
      },
    },
  }),
}));

import { needsLocationHint, retrieveLocation } from "@/libs/linq/location";

describe("needsLocationHint", () => {
  it.each([
    "coffee near me",
    "what's nearby",
    "the nearest pharmacy",
    "closest hardware store",
    "a locksmith in my area",
    "best tacos in the area",
    "somewhere around here",
    "food around me",
    "close by please",
    "can someone come to where I am",
    "send it to my address",
    "a plumber to my place",
    "what's happening downtown",
    "anything fun in town",
    "within walking distance",
    "on campus",
    "a local handyman",
  ])("hears a local brief in %j", (text) => {
    expect(needsLocationHint(text)).toBe(true);
  });

  it.each([
    "summarize this article for me",
    "book a flight to Tokyo",
    "fix my resume",
    "what does this error mean",
  ])("stays quiet for %j", (text) => {
    expect(needsLocationHint(text)).toBe(false);
  });
});

describe("retrieveLocation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reads lat/lng out of the GeoJSON share (lng first on the wire)", async () => {
    locationRetrieve.mockResolvedValue({
      data: {
        features: [
          { geometry: { coordinates: [-97.73921, 30.28265] } },
        ],
      },
    });

    expect(await retrieveLocation("chat_1")).toEqual({
      lat: 30.28265,
      lng: -97.73921,
    });
  });

  it("returns null when nothing has been shared", async () => {
    locationRetrieve.mockResolvedValue({ data: { features: [] } });

    expect(await retrieveLocation("chat_1")).toBeNull();
  });

  it("returns null instead of throwing when the API errors", async () => {
    locationRetrieve.mockRejectedValue(new Error("linq down"));

    expect(await retrieveLocation("chat_1")).toBeNull();
  });
});
