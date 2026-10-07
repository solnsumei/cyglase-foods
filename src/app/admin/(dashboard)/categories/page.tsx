import { createAdminClient } from "@/lib/supabase/admin";
import CategoryManager from "./CategoryManager";

export default async function AdminCategoriesPage() {
  const adminClient = createAdminClient();
  const { data: categories } = await adminClient
    .from("categories")
    .select("*")
    .order("display_order", { ascending: true });

  return <CategoryManager initialCategories={categories || []} />;
}
