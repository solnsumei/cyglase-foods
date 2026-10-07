import { createAdminClient } from "@/lib/supabase/admin";
import OrdersManager from "./OrdersManager";

export default async function AdminOrdersPage() {
  const adminClient = createAdminClient();

  const { data: orders } = await adminClient
    .from("orders")
    .select(`
      *,
      vendors (
        business_name,
        phone
      ),
      profiles (
        email,
        full_name
      ),
      order_items (
        *
      )
    `)
    .order("created_at", { ascending: false });

  return <OrdersManager initialOrders={orders || []} />;
}
