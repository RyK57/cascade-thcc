/**
 * Extract a 1–5 integer rating from free-form Terac submission text.
 */
export function parseTrustRating(text: string): number | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const labeled = trimmed.match(
    /\b(?:rating|score|rate|stars?)\s*[:=]?\s*([1-5])\b/i
  );
  if (labeled) return Number(labeled[1]);

  const lone = trimmed.match(/^\s*([1-5])(?:\s*\/\s*5)?\s*[.!]?$/);
  if (lone) return Number(lone[1]);

  const first = trimmed.match(/\b([1-5])\b/);
  return first ? Number(first[1]) : null;
}
