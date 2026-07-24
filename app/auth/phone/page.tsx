import type { Metadata } from "next";
import { AuthNotConfigured } from "@/components/auth/auth-not-configured";
import { PhoneLoginForm } from "@/components/auth/phone/phone-login-form";
import { isSupabaseAdminConfigured } from "@/utils/supabase/admin";
import { isSupabaseConfigured } from "@/utils/supabase/config";

export const metadata: Metadata = {
  title: "Sign in with your phone",
};

interface PhoneLoginPageProps {
  searchParams: Promise<{ next?: string; expired?: string }>;
}

export default async function PhoneLoginPage({
  searchParams,
}: PhoneLoginPageProps) {
  const { next, expired } = await searchParams;

  // Phone sign-in needs the accounts backend to store and burn challenges.
  // Without it the form could collect a number and never text anything.
  if (!isSupabaseConfigured() || !isSupabaseAdminConfigured()) {
    return <AuthNotConfigured />;
  }

  return <PhoneLoginForm nextPath={next} expired={expired === "1"} />;
}
