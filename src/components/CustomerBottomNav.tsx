"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, ShoppingBag, Store, User } from "lucide-react";

export default function CustomerBottomNav({
  isLoggedIn,
  cartCount = 0,
}: {
  isLoggedIn?: boolean;
  cartCount?: number;
}) {
  const pathname = usePathname();

  // If inside /vendor or /admin, do not render customer nav
  if (pathname.startsWith("/vendor") || pathname.startsWith("/admin")) {
    return null;
  }

  const isHome = pathname === "/";
  const isOrders = pathname.startsWith("/orders");
  const isAuth = pathname === "/login" || pathname === "/register";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-base-100/95 backdrop-blur-md border-t border-base-200 shadow-[0_-4px_25px_rgba(0,0,0,0.08)] md:hidden">
      <div className="grid grid-cols-5 h-16 items-center px-1 max-w-md mx-auto">
        {/* Home */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition-colors ${
            isHome
              ? "text-primary font-black"
              : "text-base-content/60 hover:text-base-content"
          }`}
        >
          <Home className={`w-5 h-5 ${isHome ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
          <span className="text-[10px] tracking-tight">Home</span>
        </Link>

        {/* Search */}
        <a
          href="/#search"
          className="flex flex-col items-center justify-center gap-1 py-1 text-base-content/60 hover:text-primary transition-colors"
        >
          <Search className="w-5 h-5 stroke-[1.8]" />
          <span className="text-[10px] tracking-tight">Search</span>
        </a>

        {/* Kitchens */}
        <a
          href="/#vendors"
          className="flex flex-col items-center justify-center gap-1 py-1 text-base-content/60 hover:text-primary transition-colors"
        >
          <Store className="w-5 h-5 stroke-[1.8]" />
          <span className="text-[10px] tracking-tight">Kitchens</span>
        </a>

        {/* Orders */}
        <Link
          href="/orders"
          className={`flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition-colors relative ${
            isOrders
              ? "text-primary font-black"
              : "text-base-content/60 hover:text-base-content"
          }`}
        >
          <div className="relative">
            <ShoppingBag className={`w-5 h-5 ${isOrders ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
            {cartCount > 0 && (
              <span className="badge badge-secondary badge-xs absolute -top-1.5 -right-2 text-[9px] font-bold h-4 min-w-4 px-1">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight">Orders</span>
        </Link>

        {/* Account / Sign In */}
        <Link
          href={isLoggedIn ? "/orders" : "/login"}
          className={`flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition-colors ${
            isAuth
              ? "text-primary font-black"
              : "text-base-content/60 hover:text-base-content"
          }`}
        >
          <User className={`w-5 h-5 ${isAuth ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
          <span className="text-[10px] tracking-tight">
            {isLoggedIn ? "Account" : "Sign In"}
          </span>
        </Link>
      </div>
    </nav>
  );
}
