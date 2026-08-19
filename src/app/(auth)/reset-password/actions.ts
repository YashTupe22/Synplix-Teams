"use server";

import { createClient } from "@/lib/supabase/server";

export async function resetPassword(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirm_password") as string;

  if (!password || !confirmPassword) {
    return { error: "Please fill in all fields." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters long." };
  }

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    if (error.message.includes("same password")) {
      return {
        error: "New password must be different from your current password.",
      };
    }
    return { error: "Unable to reset password. Please try again." };
  }

  return { success: true };
}
