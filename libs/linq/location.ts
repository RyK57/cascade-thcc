import { createLinqClient } from "./client";

export async function requestLocation(chatId: string): Promise<void> {
  const client = createLinqClient();
  await client.chats.location.request(chatId);
}

export async function retrieveLocation(chatId: string): Promise<{
  lat?: number;
  lng?: number;
} | null> {
  try {
    const client = createLinqClient();
    const result = await client.chats.location.retrieve(chatId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (result as any)?.data ?? result;
    const features = data?.features;
    if (!Array.isArray(features) || !features.length) return null;
    const coords = features[0]?.geometry?.coordinates;
    if (!Array.isArray(coords) || coords.length < 2) return null;
    const [lng, lat] = coords;
    if (typeof lat === "number" && typeof lng === "number") {
      return { lat, lng };
    }
    return null;
  } catch (error) {
    console.warn("[linq] retrieveLocation failed", error);
    return null;
  }
}

export function needsLocationHint(text: string): boolean {
  return /\b(near|nearby|campus|location|local|around me|close by)\b/i.test(
    text
  );
}

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
