import { requireVendor } from "@/lib/vendor";
import { createAdminClient } from "@/lib/supabase/admin";
import VendorMenuClient from "./VendorMenuClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function VendorMenuPage() {
  const { vendor } = await requireVendor();

  if (!vendor) {
    redirect("/vendor/onboarding");
  }

  const supabase = createAdminClient();

  const [{ data: items }, { data: categories }] = await Promise.all([
    supabase
      .from("menu_items")
      .select("*, categories(name, slug)")
      .eq("vendor_id", vendor.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true }),
  ]);

  return (
    <VendorMenuClient
      vendorId={vendor.id}
      initialItems={items || []}
      categories={categories || []}
    />
  );
}
