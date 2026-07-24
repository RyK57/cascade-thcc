"use server";

import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";
import type { AuthActionState } from "@/lib/types/auth";
import { createClient } from "@/utils/supabase/server";

export async function signInAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? ROUTES.main);

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { error: "Supabase is not configured yet." };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: error.message };
  }

  redirect(safeNextPath(next));
}

/**
 * Only same-origin paths. A leading `/` is not enough: `//evil.com` (and the
 * backslash variants some browsers normalize) is protocol-relative, so it
 * would redirect off-site straight from the login form.
 */
function safeNextPath(next: string): string {
  if (!next.startsWith("/")) return ROUTES.main;
  if (next.startsWith("//") || next.startsWith("/\\")) return ROUTES.main;
  return next;
}
