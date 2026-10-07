import { createAdminClient } from "@/lib/supabase/admin";
import MenuItemsList from "./MenuItemsList";

export default async function AdminMenuItemsPage() {
  const adminClient = createAdminClient();

  const [{ data: items }, { data: categories }] = await Promise.all([
    adminClient
      .from("menu_items")
      .select(`
        *,
        vendors (
          business_name,
          city_area
        ),
        categories (
          name,
          slug
        )
      `)
      .order("created_at", { ascending: false }),
    adminClient
      .from("categories")
      .select("id, name, slug")
      .order("display_order", { ascending: true }),
  ]);

  return (
    <MenuItemsList
      initialItems={items || []}
      categories={categories || []}
    />
  );
}
