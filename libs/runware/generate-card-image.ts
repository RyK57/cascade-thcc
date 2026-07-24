import { runwareRequest } from "./client";

/** FLUX.1 schnell — fastest/cheapest (~$0.0013/image). */
const CARD_MODEL = "runware:100@1";

/** Deterministic seed per job so HUD updates keep the same artwork. */
function seedFromId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

const TIER_STYLE: Record<string, string> = {
  ai: "electric indigo circuitry waves",
  peer: "warm orange community mosaic",
  expert: "deep violet professional geometry",
};

/**
 * Generate a status-card hero image for a job. Diffusion text is unreliable,
 * so the prompt bans text; captions overlay via the card layout. Returns
 * undefined on any failure — cards degrade to text-only.
 */
export async function generateCardImage(params: {
  jobId: string;
  title: string;
  tier?: string;
}): Promise<string | undefined> {
  try {
    const style = TIER_STYLE[params.tier ?? ""] ?? "warm gradient";
    const results = await runwareRequest([
      {
        taskType: "imageInference",
        model: CARD_MODEL,
        steps: 4,
        positivePrompt: `minimal abstract banner for "${params.title}", ${style}, soft glassmorphism, orange #E8501F to indigo #6F68FF gradient accents, no text, no letters, no numbers`,
        width: 1024,
        height: 512,
        outputFormat: "JPG",
        numberResults: 1,
        seed: seedFromId(params.jobId),
        ttl: 172800,
      },
    ]);
    return results.find((r) => r.taskType === "imageInference")?.imageURL;
  } catch (error) {
    console.warn("[runware] card image failed", error);
    return undefined;
  }
}
