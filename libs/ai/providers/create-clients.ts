import Anthropic from "@anthropic-ai/sdk";
import { createXai } from "@ai-sdk/xai";
import OpenAI from "openai";

export function createOpenAIClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export function createAnthropicClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export function createXaiProvider() {
  return createXai({ apiKey: process.env.XAI_API_KEY });
}
