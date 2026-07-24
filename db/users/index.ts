import { createClient } from "@/utils/supabase/server";
import type { CreateUserInput, User } from "@/utils/schema/user";
import { createUserSchema } from "@/utils/schema/user";

export async function getUserById(id: string): Promise<User | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("users")
    .select("id, email, full_name, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    email: data.email,
    fullName: data.full_name ?? undefined,
    createdAt: data.created_at,
  };
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const parsed = createUserSchema.parse(input);
  const supabase = await createClient();

  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local",
    );
  }

  const { data, error } = await supabase
    .from("users")
    .insert({
      email: parsed.email,
      full_name: parsed.fullName,
    })
    .select("id, email, full_name, created_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create user");
  }

  return {
    id: data.id,
    email: data.email,
    fullName: data.full_name ?? undefined,
    createdAt: data.created_at,
  };
}
