import type { Metadata } from "next";
import { AUTH_COPY } from "@/components/auth/auth-copy";
import { AuthNotConfigured } from "@/components/auth/auth-not-configured";
import { ForgotPasswordForm } from "@/components/auth/forgot-password";
import { isSupabaseConfigured } from "@/utils/supabase/config";

export const metadata: Metadata = {
  title: AUTH_COPY.forgotPassword.metaTitle,
};

export default function ForgotPasswordPage() {
  if (!isSupabaseConfigured()) {
    return <AuthNotConfigured />;
  }

  return <ForgotPasswordForm />;
}
