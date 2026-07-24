const RUNWARE_API_URL = "https://api.runware.ai/v1";

export function isRunwareConfigured(): boolean {
  return Boolean(process.env.RUNWARE_API_KEY?.trim());
}

interface RunwareTask {
  taskType: string;
  taskUUID: string;
  [key: string]: unknown;
}

interface RunwareTaskResult {
  taskType: string;
  taskUUID: string;
  imageURL?: string;
  text?: string;
  [key: string]: unknown;
}

/**
 * Single-endpoint Runware call: auth task + payload tasks in one array.
 * Returns the data array; throws on HTTP or API-level errors.
 */
export async function runwareRequest(
  tasks: Omit<RunwareTask, "taskUUID">[]
): Promise<RunwareTaskResult[]> {
  const apiKey = process.env.RUNWARE_API_KEY?.trim();
  if (!apiKey) throw new Error("Runware is not configured. Set RUNWARE_API_KEY.");

  const body = [
    { taskType: "authentication", apiKey },
    ...tasks.map((task) => ({ ...task, taskUUID: crypto.randomUUID() })),
  ];

  const response = await fetch(RUNWARE_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Runware ${response.status}: ${await response.text()}`);
  }

  const payload = (await response.json()) as {
    data?: RunwareTaskResult[];
    errors?: Array<{ message?: string }>;
  };
  if (payload.errors?.length) {
    throw new Error(`Runware error: ${payload.errors[0]?.message ?? "unknown"}`);
  }
  return payload.data ?? [];
}
