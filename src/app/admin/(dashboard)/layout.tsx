import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import { logoutAdmin } from "../actions";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Store,
  Layers,
  ShoppingBag,
  Sliders,
  LogOut,
  Menu,
  ShieldAlert,
  ExternalLink,
  MapPin,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await requireAdmin();

  return (
    <div className="drawer lg:drawer-open min-h-screen bg-base-200">
      <input id="admin-drawer" type="checkbox" className="drawer-toggle" />

      <div className="drawer-content flex flex-col">
        {/* Top Navbar for Mobile & Header */}
        <header className="navbar bg-base-100 border-b border-base-300 px-4 sticky top-0 z-20 shadow-xs">
          <div className="flex-none lg:hidden">
            <label
              htmlFor="admin-drawer"
              aria-label="open sidebar"
              className="btn btn-square btn-ghost"
            >
              <Menu className="w-5 h-5" />
            </label>
          </div>

          <div className="flex-1 px-2">
            <span className="text-sm font-medium text-base-content/60 hidden sm:inline">
              Control Panel
            </span>
          </div>

          <div className="flex-none gap-3 items-center">
            <Link
              href="/"
              target="_blank"
              className="btn btn-ghost btn-xs sm:btn-sm gap-1.5 text-xs font-semibold"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">View Public Store</span>
            </Link>

            <div className="dropdown dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost btn-circle avatar placeholder"
              >
                <div className="bg-primary text-primary-content rounded-full w-9">
                  <span className="text-xs font-bold uppercase">
                    {profile?.full_name?.charAt(0) || "A"}
                  </span>
                </div>
              </div>
              <ul
                tabIndex={0}
                className="mt-3 z-30 p-2 shadow-lg menu menu-sm dropdown-content bg-base-100 rounded-box w-56 border border-base-200"
              >
                <li className="menu-title px-3 py-1.5">
                  <div className="font-semibold text-base-content">
                    {profile?.full_name || "Admin"}
                  </div>
                  <div className="text-xs text-base-content/60 truncate">
                    {user.email}
                  </div>
                </li>
                <div className="divider my-1"></div>
                <li>
                  <form action={logoutAdmin} className="w-full">
                    <button
                      type="submit"
                      className="w-full flex items-center gap-2 text-error font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </form>
                </li>
              </ul>
            </div>
          </div>
        </header>

        {/* Main Dashboard Content */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Sidebar Drawer */}
      <div className="drawer-side z-30">
        <label
          htmlFor="admin-drawer"
          aria-label="close sidebar"
          className="drawer-overlay"
        ></label>
        <aside className="bg-base-100 w-72 min-h-full border-r border-base-300 flex flex-col justify-between">
          <div>
            {/* Cyglase Brand Header */}
            <div className="p-5 border-b border-base-200">
              <Link href="/admin" className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-content font-bold shadow-md shadow-primary/20">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-black text-lg tracking-tight leading-none">
                    <span className="text-primary">CYGLASE</span>{" "}
                    <span className="text-secondary">FOODS</span>
                  </div>
                  <span className="badge badge-primary badge-xs mt-1 font-semibold text-[10px]">
                    Admin Workspace
                  </span>
                </div>
              </Link>
            </div>

            {/* Nav Menu */}
            <ul className="menu p-3 gap-1 text-sm font-medium">
              <li>
                <Link href="/admin" className="flex items-center gap-3 py-2.5">
                  <LayoutDashboard className="w-4 h-4 text-primary" />
                  Dashboard
                </Link>
              </li>

              <li className="menu-title text-xs uppercase tracking-wider text-base-content/50 mt-4 mb-1">
                Catalog & Vendors
              </li>

              <li>
                <Link href="/admin/categories" className="flex items-center gap-3 py-2.5">
                  <Layers className="w-4 h-4 text-primary" />
                  Categories
                </Link>
              </li>

              <li>
                <Link href="/admin/vendors" className="flex items-center gap-3 py-2.5">
                  <Store className="w-4 h-4 text-primary" />
                  Vendors
                </Link>
              </li>

              <li>
                <Link href="/admin/menu-items" className="flex items-center gap-3 py-2.5">
                  <UtensilsCrossed className="w-4 h-4 text-primary" />
                  Menu Items
                </Link>
              </li>

              <li>
                <Link href="/admin/locations" className="flex items-center gap-3 py-2.5">
                  <MapPin className="w-4 h-4 text-primary" />
                  Locations & Areas
                </Link>
              </li>

              <li className="menu-title text-xs uppercase tracking-wider text-base-content/50 mt-4 mb-1">
                Sales & System
              </li>

              <li>
                <Link href="/admin/orders" className="flex items-center gap-3 py-2.5">
                  <ShoppingBag className="w-4 h-4 text-primary" />
                  Orders & Proofs
                </Link>
              </li>

              <li>
                <Link href="/admin/settings" className="flex items-center gap-3 py-2.5">
                  <Sliders className="w-4 h-4 text-primary" />
                  Platform Settings
                </Link>
              </li>
            </ul>
          </div>

          {/* Sidebar Footer User Info */}
          <div className="p-4 border-t border-base-200 bg-base-200/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">
                    {profile?.full_name || "Admin"}
                  </p>
                  <p className="text-[11px] text-base-content/60 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
              <form action={logoutAdmin}>
                <button
                  type="submit"
                  title="Sign out"
                  className="btn btn-ghost btn-xs btn-square text-error hover:bg-error/10"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
