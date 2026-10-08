import { requireVendor } from "@/lib/vendor";
import KitchenToggleHeader from "../KitchenToggleHeader";
import VendorBottomNav from "../VendorBottomNav";
import { redirect } from "next/navigation";

export default async function VendorAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { vendor } = await requireVendor();

  if (!vendor) {
    redirect("/vendor/onboarding");
  }

  return (
    <div className="min-h-screen bg-base-200/40 flex flex-col">
      {/* Top Header with brand, desktop nav & instant kitchen actions */}
      <KitchenToggleHeader
        vendorId={vendor.id}
        businessName={vendor.business_name}
        initialIsOpen={vendor.is_open}
        storeSlug={vendor.slug}
        cityArea={vendor.city_area}
        state={vendor.state}
      />

      {/* Main Content: Wide, responsive layout for desktop and clean mobile view */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-12">
        {children}
      </main>

      {/* Mobile-first Bottom Navigation Bar */}
      <VendorBottomNav storeSlug={vendor.slug} />
    </div>
  );
}
