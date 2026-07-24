import { AuthNotConfigured } from "@/components/auth/auth-not-configured";
import { SignUpForm } from "@/components/auth/sign-up";
import { isSupabaseConfigured } from "@/utils/supabase/config";

export default function SignUpPage() {
  if (!isSupabaseConfigured()) {
    return <AuthNotConfigured />;
  }

  return <SignUpForm />;
}
