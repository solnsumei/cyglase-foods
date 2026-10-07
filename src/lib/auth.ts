import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Database } from "@/types/database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return { user, profile };
}

export async function requireAdmin() {
  const data = await getCurrentUser();

  if (!data || !data.user) {
    redirect("/admin/login");
  }

  if (data.profile?.role !== "admin") {
    redirect("/admin/login?error=Access%20denied.%20Admin%20privileges%20required.");
  }

  return { user: data.user, profile: data.profile };
}
