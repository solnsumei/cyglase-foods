import { createAdminClient } from "@/lib/supabase/admin";
import OrderAnalyticsClient from "./OrderAnalyticsClient";

export default async function AdminOrdersPage() {
  const adminClient = createAdminClient();

  const [{ data: orders }, { data: vendors }] = await Promise.all([
    adminClient
      .from("orders")
      .select("id, vendor_id, status, delivery_city, created_at")
      .order("created_at", { ascending: false }),
    adminClient
      .from("vendors")
      .select("id, business_name, city_area, city")
      .order("business_name", { ascending: true }),
  ]);

  return (
    <OrderAnalyticsClient
      orders={orders || []}
      vendors={vendors || []}
    />
  );
}
