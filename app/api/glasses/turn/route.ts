import { NextResponse } from "next/server";
import { z } from "zod";
import { getLatestJobByHandle } from "@/db/jobs";
import { runAgentTurn } from "@/libs/agent";
import { captionImage, isRunwareConfigured } from "@/libs/runware";
import { isSupabaseAdminConfigured } from "@/utils/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z.object({
  /** E.164 phone of the glasses wearer (must have texted Cascade before). */
  handle: z.string().min(3),
  /** Transcribed voice command from the glasses mic. */
  text: z.string().optional(),
  /** Glasses camera capture as a data URI (data:image/jpeg;base64,...). */
  imageDataUri: z.string().optional(),
});

/**
 * Voice/vision turn from the iOS glasses companion app (Meta Wearables DAT).
 * Runs the same Cascade agent loop as an inbound iMessage; the reply also
 * lands in the wearer's iMessage thread, and is returned here for the glasses
 * to speak aloud via TTS.
 */
export async function POST(request: Request) {
  const token = process.env.GLASSES_TOKEN?.trim();
  if (token) {
    const provided = new URL(request.url).searchParams.get("token");
    if (provided !== token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  const { handle, imageDataUri } = parsed.data;
  let text = parsed.data.text?.trim() ?? "";

  if (!text && !imageDataUri) {
    return NextResponse.json(
      { error: "Provide text and/or imageDataUri" },
      { status: 400 }
    );
  }

  // The wearer must have an existing Cascade thread (sandbox is inbound-first).
  const latestJob = await getLatestJobByHandle(handle);
  if (!latestJob) {
    return NextResponse.json(
      {
        reply:
          "I don't have a Cascade thread for this number yet — text the Cascade number once first.",
        ok: false,
      },
      { status: 404 }
    );
  }

  if (imageDataUri && isRunwareConfigured()) {
    const caption = await captionImage(
      imageDataUri,
      "Describe what the wearer of smart glasses is looking at, as context for a task request. Note objects, text, and problems visible."
    );
    if (caption) {
      text = text
        ? `${text}\n[Looking at: ${caption}]`
        : `[Looking at: ${caption}] Figure out what task I need from this.`;
    }
  }
  if (!text) {
    text = "I sent a photo from my glasses — ask me what I need done.";
  }

  const result = await runAgentTurn({
    kind: "text",
    eventId: `glasses-turn:${crypto.randomUUID()}`,
    messageId: `glasses-turn:${crypto.randomUUID()}`,
    chatId: latestJob.linqChatId,
    senderHandle: handle,
    text,
  });

  return NextResponse.json({
    ok: true,
    action: result.action,
    jobId: result.jobId,
    reply:
      result.reply ??
      "Done — check your Cascade thread in Messages for the details.",
  });
}
