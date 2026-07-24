import { AuthNotConfigured } from "@/components/auth/auth-not-configured";
import { LoginForm } from "@/components/auth/login";
import { isSupabaseConfigured } from "@/utils/supabase/config";

interface LoginPageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;

  if (!isSupabaseConfigured()) {
    return <AuthNotConfigured />;
  }

  return <LoginForm nextPath={next} />;
}
