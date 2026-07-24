import { AuthNotConfigured } from "@/components/auth/auth-not-configured";
import { ForgotPasswordForm } from "@/components/auth/forgot-password";
import { isSupabaseConfigured } from "@/utils/supabase/config";

export default function ForgotPasswordPage() {
  if (!isSupabaseConfigured()) {
    return <AuthNotConfigured />;
  }

  return <ForgotPasswordForm />;
}
