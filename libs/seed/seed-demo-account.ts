import { getDemoCredentials } from "./demo-credentials";
import { createAdminClient } from "@/utils/supabase/admin";

export interface SeedDemoAccountResult {
  userId: string;
  email: string;
  created: boolean;
}

export async function seedDemoAccount(): Promise<SeedDemoAccountResult> {
  const { email, password, fullName } = getDemoCredentials();
  const supabase = createAdminClient();

  const { data: listed, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    throw new Error(`Failed to list users: ${listError.message}`);
  }

  const existing = listed.users.find(
    (user) => user.email?.toLowerCase() === email.toLowerCase(),
  );

  let userId = existing?.id;
  let created = false;

  if (!userId) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (error || !data.user) {
      throw new Error(error?.message ?? "Failed to create demo auth user");
    }

    userId = data.user.id;
    created = true;
  } else {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (error) {
      throw new Error(`Failed to update demo auth user: ${error.message}`);
    }
  }

  const { error: profileError } = await supabase.from("users").upsert(
    {
      id: userId,
      email,
      full_name: fullName,
    },
    { onConflict: "id" },
  );

  if (profileError) {
    throw new Error(`Failed to upsert demo profile: ${profileError.message}`);
  }

  return { userId, email, created };
}
