import { requireVendor } from "@/lib/vendor";
import { createAdminClient } from "@/lib/supabase/admin";
import VendorSalesClient from "./VendorSalesClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function VendorSalesPage() {
  const { vendor } = await requireVendor();

  if (!vendor) {
    redirect("/vendor/onboarding");
  }

  const supabase = createAdminClient();

  // Fetch all vendor orders with their associated order items for comprehensive sales reporting
  const { data: orders } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false });

  return <VendorSalesClient initialOrders={orders || []} businessName={vendor.business_name} />;
}
