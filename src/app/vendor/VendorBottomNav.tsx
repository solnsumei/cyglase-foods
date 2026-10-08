"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, UtensilsCrossed, BarChart3, Sliders } from "lucide-react";

export default function VendorBottomNav({ storeSlug }: { storeSlug?: string }) {
  const pathname = usePathname();

  const isOrders = pathname === "/vendor";
  const isMenu = pathname.startsWith("/vendor/menu");
  const isSales = pathname.startsWith("/vendor/sales");
  const isSettings = pathname.startsWith("/vendor/settings");

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-base-100/95 backdrop-blur-md border-t border-base-200 shadow-[0_-4px_25px_rgba(0,0,0,0.08)] md:hidden">
      <div className="grid grid-cols-4 h-16 items-center px-1 max-w-md mx-auto">
        {/* Orders */}
        <Link
          href="/vendor"
          className={`flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition-colors ${
            isOrders
              ? "text-primary font-black"
              : "text-base-content/60 hover:text-base-content"
          }`}
        >
          <ShoppingBag className={`w-5 h-5 ${isOrders ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
          <span className="text-[10px] tracking-tight">Orders</span>
        </Link>

        {/* Menu */}
        <Link
          href="/vendor/menu"
          className={`flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition-colors ${
            isMenu
              ? "text-primary font-black"
              : "text-base-content/60 hover:text-base-content"
          }`}
        >
          <UtensilsCrossed className={`w-5 h-5 ${isMenu ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
          <span className="text-[10px] tracking-tight">Menu</span>
        </Link>

        {/* Sales Report */}
        <Link
          href="/vendor/sales"
          className={`flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition-colors ${
            isSales
              ? "text-primary font-black"
              : "text-base-content/60 hover:text-base-content"
          }`}
        >
          <BarChart3 className={`w-5 h-5 ${isSales ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
          <span className="text-[10px] tracking-tight">Sales</span>
        </Link>

        {/* Settings */}
        <Link
          href="/vendor/settings"
          className={`flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition-colors ${
            isSettings
              ? "text-primary font-black"
              : "text-base-content/60 hover:text-base-content"
          }`}
        >
          <Sliders className={`w-5 h-5 ${isSettings ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
          <span className="text-[10px] tracking-tight">Settings</span>
        </Link>
      </div>
    </nav>
  );
}
