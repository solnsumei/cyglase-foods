import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import AccountClient from "./AccountClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Account | Cyglase Foods",
  description: "Manage your profile, view orders, and manage kitchen vendor settings.",
};

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/account");
  }

  const adminClient = createAdminClient();

  // Fetch orders count and vendor status in parallel
  const [
    { count: totalOrders },
    { data: vendorData },
  ] = await Promise.all([
    adminClient
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("customer_id", user.id),
    adminClient
      .from("vendors")
      .select("id, business_name, slug, is_open")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  return (
    <AccountClient
      user={user}
      isVendor={!!vendorData}
      vendor={vendorData || null}
      totalOrders={totalOrders || 0}
    />
  );
}
