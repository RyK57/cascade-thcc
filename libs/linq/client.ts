import LinqAPIV3 from "@linqapp/sdk";

export function isLinqConfigured(): boolean {
  return Boolean(
    process.env.LINQ_API_V3_API_KEY?.trim() || process.env.LINQ_API_KEY?.trim()
  );
}

export function createLinqClient(): LinqAPIV3 {
  const apiKey =
    process.env.LINQ_API_V3_API_KEY?.trim() || process.env.LINQ_API_KEY?.trim();

  if (!apiKey) {
    throw new Error(
      "Linq is not configured. Set LINQ_API_V3_API_KEY (or LINQ_API_KEY)."
    );
  }

  return new LinqAPIV3({ apiKey });
}
