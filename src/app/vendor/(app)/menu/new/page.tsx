import { requireVendor } from "@/lib/vendor";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import MenuItemForm from "../MenuItemForm";

export const dynamic = "force-dynamic";

export default async function NewMenuItemPage() {
  const { vendor } = await requireVendor();

  if (!vendor) {
    redirect("/vendor/onboarding");
  }

  const supabase = createAdminClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  return (
    <MenuItemForm
      vendorId={vendor.id}
      categories={categories || []}
      mode="create"
    />
  );
}
