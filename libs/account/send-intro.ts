import { getLatestJobByHandle } from "@/db/jobs";
import {
  getLinqFromNumber,
  isLinqConfigured,
  sendChatMessage,
  sendTextMessage,
} from "@/libs/linq";

export function accountIntroMessage(): string {
  return (
    "Hi — I'm Cascade, your assistant for anything. Your number's verified " +
    "and this thread is your account. Text me whatever you need done — a " +
    "question, an errand, research, a fix — and I'll handle it or bring in " +
    "the right person, payment included. What can I take on first?"
  );
}

/**
 * Greet a number that just proved ownership for the first time. The person
 * asked us to text them moments ago on the website, and the greeting opens a
 * conversation rather than broadcasting — both channel rules hold.
 *
 * Best-effort by design: sign-in must never fail because a hello could not
 * be delivered.
 */
export async function sendAccountIntro(phone: string): Promise<boolean> {
  if (!isLinqConfigured()) return false;

  try {
    const job = await getLatestJobByHandle(phone).catch(() => null);
    if (job) {
      await sendChatMessage({
        chatId: job.linqChatId,
        text: accountIntroMessage(),
      });
      return true;
    }

    const from = getLinqFromNumber();
    if (!from) {
      console.warn("[cascade] can't send intro: set LINQ_FROM_NUMBER");
      return false;
    }
    await sendTextMessage({ from, to: [phone], text: accountIntroMessage() });
    return true;
  } catch (error) {
    console.warn("[cascade] account intro send failed", error);
    return false;
  }
}
