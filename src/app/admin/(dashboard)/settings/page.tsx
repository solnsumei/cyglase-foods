import { createAdminClient } from "@/lib/supabase/admin";
import SettingsManager from "./SettingsManager";

export default async function AdminSettingsPage() {
  const adminClient = createAdminClient();
  const { data: settings } = await adminClient
    .from("platform_settings")
    .select("*")
    .order("key", { ascending: true });

  return <SettingsManager initialSettings={settings || []} />;
}
