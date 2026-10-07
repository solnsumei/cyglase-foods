"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, UtensilsCrossed, Sliders, Store } from "lucide-react";

export default function VendorBottomNav({ storeSlug }: { storeSlug?: string }) {
  const pathname = usePathname();

  const isOrders = pathname === "/vendor";
  const isMenu = pathname.startsWith("/vendor/menu");
  const isSettings = pathname.startsWith("/vendor/settings");

  return (
    <nav className="btm-nav btm-nav-md border-t border-base-300 bg-base-100 z-40 shadow-lg sm:max-w-md sm:mx-auto sm:rounded-t-2xl">
      <Link
        href="/vendor"
        className={`${isOrders ? "active text-primary font-bold" : "text-base-content/60"}`}
      >
        <ShoppingBag className="w-5 h-5" />
        <span className="btm-nav-label text-[11px]">Orders</span>
      </Link>

      <Link
        href="/vendor/menu"
        className={`${isMenu ? "active text-primary font-bold" : "text-base-content/60"}`}
      >
        <UtensilsCrossed className="w-5 h-5" />
        <span className="btm-nav-label text-[11px]">My Menu</span>
      </Link>

      {storeSlug && (
        <Link
          href={`/store/${storeSlug}`}
          target="_blank"
          className="text-base-content/60 hover:text-primary"
        >
          <Store className="w-5 h-5" />
          <span className="btm-nav-label text-[11px]">Storefront</span>
        </Link>
      )}

      <Link
        href="/vendor/settings"
        className={`${isSettings ? "active text-primary font-bold" : "text-base-content/60"}`}
      >
        <Sliders className="w-5 h-5" />
        <span className="btm-nav-label text-[11px]">Settings</span>
      </Link>
    </nav>
  );
}
