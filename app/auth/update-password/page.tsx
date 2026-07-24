import { AuthNotConfigured } from "@/components/auth/auth-not-configured";
import { UpdatePasswordForm } from "@/components/auth/update-password";
import { isSupabaseConfigured } from "@/utils/supabase/config";

export default function UpdatePasswordPage() {
  if (!isSupabaseConfigured()) {
    return <AuthNotConfigured />;
  }

  return <UpdatePasswordForm />;
}
