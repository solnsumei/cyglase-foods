"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChefHat,
  Home,
  Search,
  Store,
  ShoppingBag,
  User,
  LogOut,
  ChevronRight,
  MapPin,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface CustomerTopNavProps {
  user?: any;
  isVendor?: boolean;
}

export default function CustomerTopNav({
  user,
  isVendor = false,
}: CustomerTopNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  // If inside vendor or admin dashboards, do not render customer top nav
  if (pathname.startsWith("/vendor") || pathname.startsWith("/admin")) {
    return null;
  }

  const isHome = pathname === "/";
  const isSearch = pathname.startsWith("/search");
  const isOutlets = pathname.startsWith("/outlets");
  const isOrders = pathname.startsWith("/orders");

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  };

  const navLinks = [
    { href: "/", label: "Home", icon: Home, active: isHome },
    { href: "/#search", label: "Search", icon: Search, active: false },
    { href: "/outlets", label: "Outlets", icon: Store, active: isOutlets },
    { href: "/orders", label: "Orders", icon: ShoppingBag, active: isOrders },
  ];

  return (
    <nav className="hidden md:block sticky top-0 z-40 bg-base-100/95 backdrop-blur-md border-b border-base-200 shadow-xs">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-9 h-9 rounded-2xl bg-primary text-white flex items-center justify-center font-black shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
            <ChefHat className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight leading-none">
              <span className="text-primary">CYGLASE</span>{" "}
              <span className="text-secondary">FOODS</span>
            </span>
            <span className="text-[10px] font-bold text-base-content/50 uppercase tracking-widest mt-0.5">
              Nigerian Food Market
            </span>
          </div>
        </Link>

        {/* Center Desktop Navigation Menu */}
        <div className="flex items-center gap-1.5 bg-base-200/60 p-1.5 rounded-2xl border border-base-200">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  link.active
                    ? "bg-base-100 text-primary shadow-xs font-black"
                    : "text-base-content/70 hover:text-base-content hover:bg-base-100/60"
                }`}
              >
                <Icon className={`w-4 h-4 ${link.active ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Right Section: Sell Food & User Dropdown */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/vendor/login"
            className="btn btn-ghost btn-sm text-xs font-bold text-secondary hover:bg-secondary/10 rounded-xl gap-1.5"
          >
            <Store className="w-3.5 h-3.5" />
            <span>Sell Food</span>
          </Link>

          {user ? (
            <div className="dropdown dropdown-end">
              <label
                tabIndex={0}
                className="btn btn-ghost btn-circle btn-sm bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                title={user.email}
              >
                <User className="w-4 h-4" />
              </label>
              <ul
                tabIndex={0}
                className="dropdown-content menu p-2 shadow-2xl bg-base-100 rounded-2xl w-56 z-50 border border-base-200 text-xs font-semibold mt-2"
              >
                <li className="menu-title text-[10px] text-base-content/60 px-3 py-1">
                  Signed in as <span className="font-bold text-base-content">{user.email}</span>
                </li>
                <li>
                  <Link href="/account" className="py-2.5">
                    <User className="w-4 h-4" /> My Account
                  </Link>
                </li>
                <li>
                  <Link href="/orders" className="py-2.5">
                    <ShoppingBag className="w-4 h-4" /> My Orders
                  </Link>
                </li>
                {isVendor && (
                  <li>
                    <Link href="/vendor" className="py-2.5 text-primary font-bold">
                      <Store className="w-4 h-4" /> Kitchen Dashboard
                    </Link>
                  </li>
                )}
                <div className="divider my-1"></div>
                <li>
                  <button onClick={handleSignOut} className="py-2 text-error">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </li>
              </ul>
            </div>
          ) : (
            <Link
              href="/login"
              className="btn btn-primary btn-sm rounded-xl font-bold text-white text-xs px-4 shadow-sm"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
