import { ROUTES } from "@/lib/constants/routes";
import { getPublicSiteUrl } from "@/lib/constants/site";

/** Checkout for one specific job on the deployed site — never a bare home page. */
export function getPayUrl(jobId: string): string {
  return `${getPublicSiteUrl()}${ROUTES.main}?job=${jobId}`;
}
