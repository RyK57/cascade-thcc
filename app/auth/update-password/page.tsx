import type { Metadata } from "next";
import { AUTH_COPY } from "@/components/auth/auth-copy";
import { AuthNotConfigured } from "@/components/auth/auth-not-configured";
import { UpdatePasswordForm } from "@/components/auth/update-password";
import { isSupabaseConfigured } from "@/utils/supabase/config";

export const metadata: Metadata = {
  title: AUTH_COPY.updatePassword.metaTitle,
};

export default function UpdatePasswordPage() {
  if (!isSupabaseConfigured()) {
    return <AuthNotConfigured />;
  }

  return <UpdatePasswordForm />;
}
