import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  formatTexterLocation,
  resolveTexterLocation,
} from "@/libs/agent/texter-location";
import { updateJob } from "@/db/jobs";
import { getUserByPhone, upsertUserByPhone } from "@/db/users";
import { retrieveLocation } from "@/libs/linq/location";
import type { Job } from "@/utils/schema/job";

vi.mock("@/db/jobs", () => ({
  updateJob: vi.fn(async () => undefined),
}));

vi.mock("@/db/users", () => ({
  getUserByPhone: vi.fn(async () => null),
  upsertUserByPhone: vi.fn(async () => undefined),
}));

vi.mock("@/libs/linq/location", () => ({
  retrieveLocation: vi.fn(async () => null),
}));

function job(partial: Partial<Job> = {}): Job {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    linqChatId: "chat_1",
    requesterHandle: "+15551234567",
    title: "Nearby coffee",
    description: "Find coffee near me",
    status: "intake",
    statusCardIsRich: false,
    walletRefuseCount: 0,
    expertTimelineAck: false,
    createdAt: "2026-07-24T00:00:00.000Z",
    updatedAt: "2026-07-24T00:00:00.000Z",
    ...partial,
  };
}

describe("formatTexterLocation", () => {
  it("includes coords and source", () => {
    expect(
      formatTexterLocation({
        lat: 37.4275,
        lng: -122.1697,
        source: "live",
      })
    ).toContain("37.42750, -122.16970");
    expect(
      formatTexterLocation({
        lat: 37.4275,
        lng: -122.1697,
        source: "live",
      })
    ).toContain("live share");
  });
});

describe("resolveTexterLocation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("prefers a live Linq share and persists it", async () => {
    vi.mocked(retrieveLocation).mockResolvedValue({
      lat: 37.44,
      lng: -122.15,
    });

    const result = await resolveTexterLocation({
      chatId: "chat_1",
      phone: "+15551234567",
      job: job(),
    });

    expect(result).toEqual({
      lat: 37.44,
      lng: -122.15,
      source: "live",
    });
    expect(updateJob).toHaveBeenCalledWith(job().id, {
      requesterLat: 37.44,
      requesterLng: -122.15,
    });
    expect(upsertUserByPhone).toHaveBeenCalled();
  });

  it("falls back to job coords", async () => {
    vi.mocked(retrieveLocation).mockResolvedValue(null);

    const result = await resolveTexterLocation({
      chatId: "chat_1",
      phone: "+15551234567",
      job: job({ requesterLat: 37.1, requesterLng: -122.2 }),
    });

    expect(result).toEqual({
      lat: 37.1,
      lng: -122.2,
      source: "job",
    });
    expect(upsertUserByPhone).not.toHaveBeenCalled();
  });

  it("falls back to profile coords and attaches them to the job", async () => {
    vi.mocked(retrieveLocation).mockResolvedValue(null);
    vi.mocked(getUserByPhone).mockResolvedValue({
      id: "22222222-2222-4222-8222-222222222222",
      phone: "+15551234567",
      role: "both",
      creditBalance: 0,
      trustScore: 50,
      lastLat: 37.42,
      lastLng: -122.16,
      createdAt: "2026-07-24T00:00:00.000Z",
    });

    const result = await resolveTexterLocation({
      chatId: "chat_1",
      phone: "+15551234567",
      job: job(),
    });

    expect(result?.source).toBe("profile");
    expect(updateJob).toHaveBeenCalledWith(job().id, {
      requesterLat: 37.42,
      requesterLng: -122.16,
    });
  });
});
