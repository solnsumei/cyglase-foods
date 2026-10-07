import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import OutletsClient from "./OutletsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Food Outlets & Kitchens | Cyglase Foods",
  description: "Browse registered food outlets, cloud kitchens, and local restaurants across Nigeria.",
};

export default async function OutletsPage() {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const [
    {
      data: { user },
    },
    { data: vendors },
    { data: menuItems },
  ] = await Promise.all([
    supabase.auth.getUser(),
    adminClient
      .from("vendors")
      .select("*")
      .eq("is_active", true)
      .order("business_name", { ascending: true }),
    adminClient
      .from("menu_items")
      .select("id, vendor_id")
      .eq("is_available", true),
  ]);

  let isVendor = false;
  if (user) {
    const { data: vendorData } = await adminClient
      .from("vendors")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (vendorData) {
      isVendor = true;
    }
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-3">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="text-sm font-semibold text-base-content/60">
              Loading food outlets...
            </p>
          </div>
        </div>
      }
    >
      <OutletsClient
        user={user}
        isVendor={isVendor}
        vendors={vendors || []}
        menuItems={menuItems || []}
      />
    </Suspense>
  );
}
