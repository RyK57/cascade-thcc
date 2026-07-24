import { runwareRequest } from "./client";

/**
 * Vision for Cascade: describe an inbound photo (task context, glasses shots)
 * so triage can treat it as part of the request. Returns undefined on failure —
 * callers degrade to text-only handling.
 */
export async function captionImage(
  imageUrl: string,
  guidance?: string
): Promise<string | undefined> {
  try {
    const results = await runwareRequest([
      {
        taskType: "caption",
        inputImage: imageUrl,
        ...(guidance ? { prompt: guidance } : {}),
      },
    ]);
    const text = results.find((r) => r.taskType === "caption")?.text?.trim();
    return text || undefined;
  } catch (error) {
    console.warn("[runware] caption failed", error);
    return undefined;
  }
}
