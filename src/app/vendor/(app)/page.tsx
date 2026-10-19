import { requireVendor } from "@/lib/vendor";
import { createAdminClient } from "@/lib/supabase/admin";
import VendorOrdersClient from "./VendorOrdersClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function VendorOrdersPage() {
  const { vendor } = await requireVendor();

  if (!vendor) {
    redirect("/vendor/onboarding");
  }

  const supabase = createAdminClient();

  const [ordersRes, dishesRes] = await Promise.all([
    supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("vendor_id", vendor.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("menu_items")
      .select("id", { count: "exact", head: true })
      .eq("vendor_id", vendor.id),
  ]);

  return (
    <VendorOrdersClient
      initialOrders={ordersRes.data || []}
      vendor={vendor}
      dishCount={dishesRes.count ?? 0}
    />
  );
}
