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
    <nav className="btm-nav btm-nav-md border-t border-base-200/80 bg-base-100/95 backdrop-blur-md z-40 shadow-xl sm:max-w-md sm:mx-auto sm:rounded-t-3xl">
      <Link
        href="/"
        className={`${isHome ? "active text-primary font-black" : "text-base-content/60 hover:text-primary"}`}
      >
        <Home className="w-5 h-5" />
        <span className="btm-nav-label text-[10px] font-semibold">Home</span>
      </Link>

      <a
        href="/#search"
        className="text-base-content/60 hover:text-primary"
      >
        <Search className="w-5 h-5" />
        <span className="btm-nav-label text-[10px] font-semibold">Search</span>
      </a>

      <a
        href="/#vendors"
        className="text-base-content/60 hover:text-primary"
      >
        <Store className="w-5 h-5" />
        <span className="btm-nav-label text-[10px] font-semibold">Kitchens</span>
      </a>

      <Link
        href="/orders"
        className={`relative ${isOrders ? "active text-primary font-black" : "text-base-content/60 hover:text-primary"}`}
      >
        <div className="relative">
          <ShoppingBag className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="badge badge-secondary badge-xs absolute -top-2 -right-2 text-[9px] font-bold">
              {cartCount}
            </span>
          )}
        </div>
        <span className="btm-nav-label text-[10px] font-semibold">Orders</span>
      </Link>

      <Link
        href={isLoggedIn ? "/orders" : "/login"}
        className={`${isAuth ? "active text-primary font-black" : "text-base-content/60 hover:text-primary"}`}
      >
        <User className="w-5 h-5" />
        <span className="btm-nav-label text-[10px] font-semibold">
          {isLoggedIn ? "Account" : "Sign In"}
        </span>
      </Link>
    </nav>
  );
}
