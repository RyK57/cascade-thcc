import { createLinqClient } from "./client";

export async function checkIMessage(address: string): Promise<boolean> {
  try {
    const client = createLinqClient();
    const result = await client.capability.checkIMessage({ address });
    return Boolean(result?.available ?? result);
  } catch (error) {
    console.warn("[linq] capability check failed; falling back to text", error);
    return false;
  }
}
