"use server";

import { ROUTES } from "@/lib/constants/routes";
import type { AuthActionState } from "@/lib/types/auth";
import { createClient } from "@/utils/supabase/server";

export async function signUpAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { error: "Supabase is not configured yet." };
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}${ROUTES.auth.callback}`,
      data: { full_name: fullName || undefined },
    },
  });

  if (error) {
    return { error: error.message };
  }

  return {
    success: "Check your email to confirm your account, then sign in.",
  };
}
