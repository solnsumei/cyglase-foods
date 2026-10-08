import { requireVendor } from "@/lib/vendor";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import MenuItemForm from "../MenuItemForm";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditMenuItemPage({ params }: Props) {
  const { id } = await params;
  const { vendor } = await requireVendor();

  if (!vendor) {
    redirect("/vendor/onboarding");
  }

  const supabase = createAdminClient();

  const [{ data: item }, { data: categories }] = await Promise.all([
    supabase
      .from("menu_items")
      .select("*, categories(name, slug)")
      .eq("id", id)
      .eq("vendor_id", vendor.id)
      .single(),
    supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true }),
  ]);

  if (!item) {
    notFound();
  }

  return (
    <MenuItemForm
      vendorId={vendor.id}
      categories={categories || []}
      initialItem={item}
      mode="edit"
    />
  );
}
