import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import StorefrontClient from "./StorefrontClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function StorefrontPage({ params }: Props) {
  const { slug } = await params;

  const adminClient = createAdminClient();
  const supabase = await createClient();

  const [
    { data: vendor },
    { data: categories },
    {
      data: { user },
    },
  ] = await Promise.all([
    adminClient
      .from("vendors")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single(),
    adminClient
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true }),
    supabase.auth.getUser(),
  ]);

  if (!vendor) {
    notFound();
  }

  // Fetch menu items for this vendor
  const { data: menuItems } = await adminClient
    .from("menu_items")
    .select("*, categories(name, slug)")
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false });

  return (
    <StorefrontClient
      vendor={vendor}
      menuItems={menuItems || []}
      categories={categories || []}
      currentUser={user}
    />
  );
}
