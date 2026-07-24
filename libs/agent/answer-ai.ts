import { createAnthropicClient, createOpenAIClient } from "@/libs/ai";
import { appendUserTurn, type ConversationTurn } from "./conversation";
import { aiFollowUpSuggest } from "./reply-templates";

export interface AiAnswerResult {
  answer: string;
  followUp: string;
}

const ANSWER_SYSTEM = `You are Cascade, an iMessage task agent. Answer the latest task completely and concisely for SMS/iMessage (short paragraphs, no markdown headings).

Earlier messages from this thread come first, and they are the same person you are replying to now. Treat a short follow-up as a continuation — carry the earlier answer's context forward instead of answering it as a standalone question.`;

export async function answerAiTask(params: {
  title: string;
  description: string;
  history?: ConversationTurn[];
}): Promise<AiAnswerResult> {
  const task = `Task: ${params.title}\n\nDetails:\n${params.description}`;
  const messages = appendUserTurn(params.history ?? [], task);

  let answer: string | undefined;

  if (process.env.ANTHROPIC_API_KEY?.trim()) {
    try {
      const client = createAnthropicClient();
      const response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 800,
        system: ANSWER_SYSTEM,
        messages,
      });
      answer = response.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
    } catch (error) {
      console.error("AI answer (anthropic) failed", error);
    }
  }

  if (!answer && process.env.OPENAI_API_KEY?.trim()) {
    try {
      const client = createOpenAIClient();
      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: ANSWER_SYSTEM }, ...messages],
      });
      answer = response.choices[0]?.message?.content?.trim();
    } catch (error) {
      console.error("AI answer (openai) failed", error);
    }
  }

  if (!answer) {
    answer = heuristicAnswer(params.title, params.description);
  }

  const followUp = suggestFollowUp(params.title, params.description);
  return {
    answer: `${answer}\n\n${aiFollowUpSuggest(followUp)}`,
    followUp,
  };
}

function heuristicAnswer(title: string, description: string): string {
  return [
    `Here's a quick plan for "${title}":`,
    `1) Clarify the outcome you want this week.`,
    `2) Block 2–3 focus windows and one buffer.`,
    `3) Cut anything that doesn't move the goal.`,
    `Context I used: ${description.slice(0, 240)}`,
  ].join("\n");
}

function suggestFollowUp(title: string, description: string): string {
  const blob = `${title} ${description}`.toLowerCase();
  if (blob.includes("startup school") || blob.includes("week")) {
    return "Want a peer to stress-test your signup flow on a real phone?";
  }
  if (blob.includes("plan") || blob.includes("draft")) {
    return "Need a peer to review this with fresh eyes?";
  }
  return "Want me to find a verified expert to go deeper?";
}
