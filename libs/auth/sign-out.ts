"use server";

import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/utils/supabase/server";

export async function signOutAction() {
  const supabase = await createClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  redirect(ROUTES.home);
}
