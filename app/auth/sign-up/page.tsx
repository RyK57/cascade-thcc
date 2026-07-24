import type { Metadata } from "next";
import { AUTH_COPY } from "@/components/auth/auth-copy";
import { AuthNotConfigured } from "@/components/auth/auth-not-configured";
import { SignUpForm } from "@/components/auth/sign-up";
import { isSupabaseConfigured } from "@/utils/supabase/config";

export const metadata: Metadata = {
  title: AUTH_COPY.signUp.title,
};

export default function SignUpPage() {
  if (!isSupabaseConfigured()) {
    return <AuthNotConfigured />;
  }

  return <SignUpForm />;
}
