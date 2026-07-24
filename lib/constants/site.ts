/**
 * The origin Cascade puts in front of a human.
 *
 * Links that leave the process — escrow checkout, sign-in, job status — are
 * texted to a phone, so a localhost origin is not a cosmetic problem: the
 * message is undeliverable in practice. Resolution order prefers an explicit
 * site URL, then the Vercel deployment the code is actually running on, and
 * only falls back to localhost during local development.
 */
function normalize(url: string): string {
  const trimmed = url.trim().replace(/\/$/, "");
  if (!trimmed) return "";
  return /^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export const LOCAL_SITE_URL = "http://localhost:3000";

export function getSiteUrl(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    // Stable production domain of the Vercel project, not the per-deploy URL.
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
    process.env.NEXT_PUBLIC_VERCEL_URL,
  ];

  for (const candidate of candidates) {
    const url = candidate ? normalize(candidate) : "";
    if (url) return url;
  }

  return LOCAL_SITE_URL;
}

export function isLocalSiteUrl(url: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:|\/|$)/i.test(url);
}

/**
 * Origin for a URL we are about to text someone. Deployed environments must
 * never hand out a localhost link, so this throws rather than sending a
 * message the recipient cannot act on — callers fall back to in-thread
 * instructions instead.
 */
export function getPublicSiteUrl(): string {
  const url = getSiteUrl();
  if (isLocalSiteUrl(url) && process.env.NODE_ENV === "production") {
    throw new Error(
      "No public site URL configured. Set NEXT_PUBLIC_SITE_URL to the deployed domain."
    );
  }
  return url;
}
