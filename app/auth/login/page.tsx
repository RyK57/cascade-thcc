import type { Metadata } from "next";
import { AUTH_COPY } from "@/components/auth/auth-copy";
import { AuthNotConfigured } from "@/components/auth/auth-not-configured";
import { LoginForm } from "@/components/auth/login";
import { isSupabaseConfigured } from "@/utils/supabase/config";

export const metadata: Metadata = {
  title: AUTH_COPY.login.title,
};

interface LoginPageProps {
  searchParams: Promise<{ next?: string; reset?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next, reset } = await searchParams;

  if (!isSupabaseConfigured()) {
    return <AuthNotConfigured />;
  }

  return <LoginForm nextPath={next} passwordUpdated={reset === "done"} />;
}
