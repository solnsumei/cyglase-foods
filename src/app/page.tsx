import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import HomeClient from "@/components/HomeClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const [
    {
      data: { user },
    },
    { data: categories },
    { data: vendors },
    { data: featuredItems },
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
          business_name,
          slug,
          city_area,
          is_open
        ),
        categories (
          name,
          slug
        )
      `)
      .eq("is_available", true)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return (
    <HomeClient
      user={user}
      categories={categories || []}
      vendors={vendors || []}
      featuredItems={featuredItems || []}
    />
  );
}
