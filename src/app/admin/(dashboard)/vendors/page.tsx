import { createAdminClient } from "@/lib/supabase/admin";
import VendorList from "./VendorList";

export default async function AdminVendorsPage() {
  const adminClient = createAdminClient();
  const { data: vendors } = await adminClient
    .from("vendors")
    .select(`
      *,
      profiles (
        email,
        full_name
      )
    `)
    .order("created_at", { ascending: false });

  return <VendorList initialVendors={vendors || []} />;
}
