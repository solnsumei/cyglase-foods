import { requireVendor } from "@/lib/vendor";
import { createAdminClient } from "@/lib/supabase/admin";
import VendorHistoryClient from "./VendorHistoryClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function VendorOrderHistoryPage() {
  const { vendor } = await requireVendor();

  if (!vendor) {
    redirect("/vendor/onboarding");
  }

  const supabase = createAdminClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false });

  return (
    <VendorHistoryClient
      initialOrders={orders || []}
      businessName={vendor.business_name}
    />
  );
}
