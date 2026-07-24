"use server";

import { ROUTES } from "@/lib/constants/routes";
import type { AuthActionState } from "@/lib/types/auth";
import { createClient } from "@/utils/supabase/server";

export async function forgotPasswordAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { error: "Email is required." };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { error: "Supabase is not configured yet." };
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}${ROUTES.auth.updatePassword}`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: "Password reset email sent. Check your inbox." };
}
