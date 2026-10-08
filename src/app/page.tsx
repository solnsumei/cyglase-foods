import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import HomeClient from "@/components/HomeClient";
import { getStatesWithCities } from "@/lib/locations";

export const dynamic = "force-dynamic";

interface HomePageProps {
  searchParams?: Promise<{
    q?: string;
    category?: string;
    state?: string;
    area?: string;
  }>;
}

export default async function HomePage(props: HomePageProps) {
  const searchParams = await props.searchParams;
  const initialQuery = searchParams?.q || "";
  const initialCategory = searchParams?.category || "all";
  const initialState = searchParams?.state || "all";
  const initialArea = searchParams?.area || "all";

  const supabase = await createClient();
  const adminClient = createAdminClient();

  const [
    {
      data: { user },
    },
    { data: categories },
    { data: vendors },
    { data: allItems },
    locationStates,
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
      .order("created_at", { ascending: false }),
    adminClient
      .from("menu_items")
      .select(`
        *,
        vendors (
          id,
          business_name,
          slug,
          city_area,
          city,
          state,
          is_open,
          opening_time,
          closing_time,
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
    getStatesWithCities(true),
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
    <HomeClient
      user={user}
      isVendor={isVendor}
      categories={categories || []}
      vendors={vendors || []}
      initialItems={allItems || []}
      locationStates={locationStates || []}
      initialQuery={initialQuery}
      initialCategory={initialCategory}
      initialState={initialState}
      initialArea={initialArea}
    />
  );
}
