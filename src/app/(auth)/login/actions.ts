"use server";

import { createClient } from "@/lib/supabase/server";

export async function login(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.message.includes("Invalid login")) {
      return { error: "Invalid email or password. Please try again." };
    }
    if (error.message.includes("Email not confirmed")) {
      return {
        error: "Please verify your email address before signing in.",
      };
    }
    return { error: "Unable to sign in. Please try again later." };
  }

  // Check if user account is active
  if (data.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_active")
      .eq("id", data.user.id)
      .single();

    if (!profile || !profile.is_active) {
      await supabase.auth.signOut();
      return {
        error: "Your account has been deactivated. Please contact your administrator.",
      };
    }
  }

  return { success: true };
}
