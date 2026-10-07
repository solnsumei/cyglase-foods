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
      {/* Top Header with instant kitchen toggle */}
      <KitchenToggleHeader
        vendorId={vendor.id}
        businessName={vendor.business_name}
        initialIsOpen={vendor.is_open}
      />

      {/* Main Content with bottom padding to avoid overlapping the bottom nav on mobile */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 pb-24">
        {children}
      </main>

      {/* Mobile-first Bottom Navigation Bar */}
      <VendorBottomNav storeSlug={vendor.slug} />
    </div>
  );
}
