import { teracRequest } from "./client";

export interface TeracFilter {
  id: string;
  name?: string;
  type?: string;
}

/** REST mirror of MCP terac_list_filters when the API exposes /filters. */
export async function listTeracFilters(): Promise<TeracFilter[]> {
  try {
    const res = await teracRequest<{ data?: TeracFilter[] } | TeracFilter[]>({
      method: "GET",
      path: "/filters",
    });
    if (Array.isArray(res)) return res;
    return res.data ?? [];
  } catch (error) {
    console.warn("[terac] list filters unavailable", error);
    return [];
  }
}

/** Heuristic expert targeting for engineering-style Cascade jobs. */
export function expertFiltersForJob(title: string, description?: string): {
  roleLabel: string;
  screeningHint: string;
} {
  const blob = `${title} ${description ?? ""}`.toLowerCase();
  if (/\b(legal|lawyer|attorney)\b/.test(blob)) {
    return {
      roleLabel: "licensed attorney",
      screeningHint: "Must hold an active law license.",
    };
  }
  if (/\b(design|ux|ui)\b/.test(blob)) {
    return {
      roleLabel: "senior product designer",
      screeningHint: "5+ years product design experience.",
    };
  }
  return {
    roleLabel: "senior engineer",
    screeningHint: "Senior IC experience reviewing production systems.",
  };
}
