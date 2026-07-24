const TERAC_API_BASE =
  process.env.TERAC_API_BASE_URL?.trim() ||
  "https://terac.com/api/external/v2";

export function isTeracConfigured(): boolean {
  return Boolean(process.env.TERAC_API_KEY?.trim());
}

export function getTeracApiKey(): string {
  const apiKey = process.env.TERAC_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Terac is not configured. Set TERAC_API_KEY.");
  }
  return apiKey;
}

export function getTeracBaseUrl(): string {
  return TERAC_API_BASE.replace(/\/$/, "");
}

export function getTeracProjectId(): string | undefined {
  return process.env.TERAC_PROJECT_ID?.trim() || undefined;
}

interface TeracRequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  query?: Record<string, string | number | undefined>;
  body?: unknown;
}

export async function teracRequest<T>({
  method = "GET",
  path,
  query,
  body,
}: TeracRequestOptions): Promise<T> {
  const url = new URL(`${getTeracBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${getTeracApiKey()}`,
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Terac API ${method} ${path} failed (${response.status}): ${errorText}`
    );
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
