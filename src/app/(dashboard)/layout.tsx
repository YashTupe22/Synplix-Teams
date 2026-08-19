import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Check if user is active
  if (!profile || !profile.is_active) {
    await supabase.auth.signOut();
    redirect("/login?error=account_inactive");
  }

  return (
    <DashboardShell user={profile}>
      {children}
    </DashboardShell>
  );
}
