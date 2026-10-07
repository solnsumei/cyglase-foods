import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import SearchClient from "./SearchClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Search Dishes & Kitchens | Cyglase Foods",
  description: "Search Nigerian dishes, soups, swallows, grills, drinks, and local kitchens near you.",
};

export default async function SearchPage() {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const [
    {
      data: { user },
    },
    { data: categories },
    { data: vendors },
    { data: menuItems },
  ] = await Promise.all([
    supabase.auth.getUser(),
    adminClient
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true }),
    adminClient
      .from("vendors")
      .select("*")
      .eq("is_active", true)
      .order("business_name", { ascending: true }),
    adminClient
      .from("menu_items")
      .select(`
        *,
        vendors (
          id,
          business_name,
          slug,
          city_area,
          is_open,
          logo_url,
          banner_url
        ),
        categories (
          id,
          name,
          slug
        )
      `)
      .eq("is_available", true)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-3">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="text-sm font-semibold text-base-content/60">
              Loading fresh Nigerian dishes...
            </p>
          </div>
        </div>
      }
    >
      <SearchClient
        user={user}
        categories={categories || []}
        vendors={vendors || []}
        initialItems={menuItems || []}
      />
    </Suspense>
  );
}
