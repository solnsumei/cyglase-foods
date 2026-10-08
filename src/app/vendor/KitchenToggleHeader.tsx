"use client";

import { useState } from "react";
import { toggleKitchenStatus } from "./actions";
import {
  ChefHat,
  Power,
  ShoppingBag,
  UtensilsCrossed,
  Sliders,
  Store,
  ExternalLink,
  Plus,
  LogOut,
  ChevronDown,
  Sparkles,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ConfirmModal from "@/components/ConfirmModal";

interface KitchenToggleHeaderProps {
  vendorId: string;
  businessName: string;
  initialIsOpen: boolean;
  storeSlug?: string;
  cityArea?: string | null;
  state?: string | null;
}

export default function KitchenToggleHeader({
  vendorId,
  businessName,
  initialIsOpen,
  storeSlug,
  cityArea,
  state,
}: KitchenToggleHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(initialIsOpen);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  const isOrders = pathname === "/vendor";
  const isMenu = pathname.startsWith("/vendor/menu");
  const isSales = pathname.startsWith("/vendor/sales");
  const isSettings = pathname.startsWith("/vendor/settings");

  const handleToggle = async () => {
    setIsUpdating(true);
    const nextState = !isOpen;
    setIsOpen(nextState);
    const res = await toggleKitchenStatus(vendorId, isOpen);
    setIsUpdating(false);
    if (res?.error) {
      setIsOpen(initialIsOpen);
      setErrorMsg(res.error);
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/vendor/login");
    router.refresh();
  };

  const navLinks = [
    { href: "/vendor", label: "Orders", icon: ShoppingBag, active: isOrders },
    { href: "/vendor/menu", label: "My Menu", icon: UtensilsCrossed, active: isMenu },
    { href: "/vendor/sales", label: "Sales Report", icon: BarChart3, active: isSales },
    { href: "/vendor/settings", label: "Settings", icon: Sliders, active: isSettings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-base-100/95 backdrop-blur-md border-b border-base-200 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand & Kitchen Identity */}
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/vendor" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-9 h-9 rounded-2xl bg-primary text-white flex items-center justify-center font-black shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
              <ChefHat className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm sm:text-base font-black tracking-tight text-base-content truncate max-w-[160px] sm:max-w-[260px]">
                {businessName}
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Desktop Navigation Bar */}
        <nav className="hidden md:flex items-center gap-1.5 bg-base-200/60 p-1.5 rounded-2xl border border-base-200">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${link.active
                    ? "bg-base-100 text-primary shadow-xs font-black"
                    : "text-base-content/70 hover:text-base-content hover:bg-base-100/60"
                  }`}
              >
                <Icon className={`w-4 h-4 ${link.active ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right: Actions Bar */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Quick Action: Add Food Item (Desktop) */}
          <Link
            href="/vendor/menu?action=add"
            className="hidden lg:inline-flex btn btn-sm btn-ghost border border-base-300 rounded-xl text-xs font-bold hover:bg-base-200 gap-1.5 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-primary" />
            <span>Add Dish</span>
          </Link>

          {/* Kitchen Live Status Action */}
          <div className="relative group">
            <button
              onClick={handleToggle}
              disabled={isUpdating}
              className={`btn btn-xs sm:btn-sm rounded-xl font-bold gap-2 transition-all shadow-xs border bg-transparent ${isOpen
                  ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                  : "border-base-300 text-base-content/60 hover:bg-base-200/50"
                }`}
              title={
                isOpen
                  ? "Kitchen is Open: Your kitchen is currently accepting orders. Click to close kitchen and pause orders."
                  : "Kitchen is Closed: Ordering is paused for customers. Click to open kitchen and start accepting orders."
              }
            >
              <span className="relative flex h-2 w-2">
                {isOpen && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${isOpen ? "bg-emerald-500" : "bg-base-content/30"
                    }`}
                ></span>
              </span>
              <span className="text-[11px] sm:text-xs">
                {isUpdating ? "Updating..." : isOpen ? "Open" : "Closed"}
              </span>
              <Power className={`w-3 h-3 ${isOpen ? "text-emerald-600" : "text-base-content/40"}`} />
            </button>
          </div>

          {/* Vendor Account & Actions Dropdown - Desktop Only */}
          <div className="hidden md:block dropdown dropdown-end">
            <label
              tabIndex={0}
              className="btn btn-ghost btn-sm rounded-xl px-2 gap-1.5 border border-base-200 hover:bg-base-200/80 cursor-pointer"
            >
              <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-xs">
                {businessName.charAt(0).toUpperCase()}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-base-content/50" />
            </label>
            <ul
              tabIndex={0}
              className="dropdown-content menu p-2 shadow-2xl bg-base-100 rounded-2xl w-56 z-50 border border-base-200 text-xs font-semibold mt-2"
            >
              <li className="menu-title text-[10px] text-base-content/60 px-3 py-1">
                Kitchen Management
              </li>
              <li>
                <div className="font-bold text-base-content py-2 px-3">
                  {businessName}
                  {cityArea && (
                    <span className="block text-[10px] font-normal text-base-content/60">
                      {cityArea}, {state}
                    </span>
                  )}
                </div>
              </li>
              <div className="divider my-1"></div>
              {storeSlug && (
                <li>
                  <Link
                    href={`/store/${storeSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <Store className="w-3.5 h-3.5" />
                      View Public Store
                    </span>
                    <ExternalLink className="w-3 h-3 opacity-50" />
                  </Link>
                </li>
              )}
              <li>
                <Link href="/vendor/menu?action=add" className="py-2">
                  <Plus className="w-3.5 h-3.5 text-primary" />
                  Add New Dish
                </Link>
              </li>
              <li>
                <Link href="/vendor/sales" className="py-2">
                  <BarChart3 className="w-3.5 h-3.5 text-primary" />
                  Sales Report
                </Link>
              </li>
              <li>
                <Link href="/vendor/settings" className="py-2">
                  <Sliders className="w-3.5 h-3.5" />
                  Kitchen Settings
                </Link>
              </li>
              <div className="divider my-1"></div>
              <li>
                <button
                  type="button"
                  onClick={() => setShowSignOutConfirm(true)}
                  className="text-error hover:bg-error/10 py-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Sign Out Confirmation Modal */}
      <ConfirmModal
        isOpen={showSignOutConfirm}
        title="Sign Out of Vendor Portal"
        message="Are you sure you want to sign out of your kitchen dashboard?"
        confirmText="Sign Out"
        cancelText="Cancel"
        type="danger"
        onConfirm={handleSignOut}
        onCancel={() => setShowSignOutConfirm(false)}
      />

      {/* In-app Error Modal */}
      <ConfirmModal
        isOpen={!!errorMsg}
        title="Kitchen Status Error"
        message={errorMsg || ""}
        confirmText="Dismiss"
        showCancel={false}
        type="warning"
        onConfirm={() => setErrorMsg(null)}
      />
    </header>
  );
}
