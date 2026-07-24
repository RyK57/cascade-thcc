import { ROUTES } from "@/lib/constants/routes";

export function getPayUrl(jobId: string): string {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
  return `${siteUrl.replace(/\/$/, "")}${ROUTES.main}?job=${jobId}`;
}
