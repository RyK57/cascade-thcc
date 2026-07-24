"use server";

import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";
import type { AuthActionState } from "@/lib/types/auth";
import { createClient } from "@/utils/supabase/server";

export async function updatePasswordAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!password || password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { error: "Supabase is not configured yet." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: error.message };
  }

  redirect(ROUTES.auth.login);
}
