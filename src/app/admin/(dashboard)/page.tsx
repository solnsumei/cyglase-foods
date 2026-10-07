import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import {
  Layers,
  Store,
  UtensilsCrossed,
  ShoppingBag,
  Clock,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export default async function AdminDashboardPage() {
  const adminClient = createAdminClient();

  // Fetch counts concurrently
  const [
    { count: categoriesCount },
    { count: vendorsCount },
    { count: menuItemsCount },
    { count: ordersCount },
    { data: recentOrders },
    { data: activeCategories },
  ] = await Promise.all([
    adminClient.from("categories").select("*", { count: "exact", head: true }),
    adminClient.from("vendors").select("*", { count: "exact", head: true }),
    adminClient.from("menu_items").select("*", { count: "exact", head: true }),
    adminClient.from("orders").select("*", { count: "exact", head: true }),
    adminClient
      .from("orders")
      .select("id, total_amount, status, created_at, delivery_city, contact_phone")
      .order("created_at", { ascending: false })
      .limit(5),
    adminClient
      .from("categories")
      .select("id, name, slug, is_active, display_order")
      .order("display_order", { ascending: true })
      .limit(7),
  ]);

  return (
    <div className="flex flex-col gap-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-primary to-primary/85 text-primary-content p-6 rounded-2xl shadow-lg shadow-primary/10">
        <div>
          <span className="badge badge-warning text-xs font-bold uppercase tracking-wider mb-2">
            Admin Workspace
          </span>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            Cyglase Foods Management
          </h1>
          <p className="text-primary-content/80 text-sm mt-1">
            Real-time catalog control, vendor management, and order transaction oversight.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/categories" className="btn btn-warning btn-sm font-bold shadow-sm">
            <Layers className="w-4 h-4" />
            Manage Categories
          </Link>
          <Link href="/admin/orders" className="btn btn-neutral btn-sm font-bold">
            <ShoppingBag className="w-4 h-4" />
            View Orders
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat bg-base-100 rounded-2xl border border-base-300 shadow-xs">
          <div className="stat-figure text-primary">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Layers className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div className="stat-title text-xs font-semibold uppercase text-base-content/60">
            Categories
          </div>
          <div className="stat-value text-2xl font-black text-primary">
            {categoriesCount || 0}
          </div>
          <div className="stat-desc text-xs mt-1">Seeded food groups</div>
        </div>

        <div className="stat bg-base-100 rounded-2xl border border-base-300 shadow-xs">
          <div className="stat-figure text-primary">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Store className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div className="stat-title text-xs font-semibold uppercase text-base-content/60">
            Registered Vendors
          </div>
          <div className="stat-value text-2xl font-black text-primary">
            {vendorsCount || 0}
          </div>
          <div className="stat-desc text-xs mt-1">Food kitchens & sellers</div>
        </div>

        <div className="stat bg-base-100 rounded-2xl border border-base-300 shadow-xs">
          <div className="stat-figure text-secondary">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-secondary" />
            </div>
          </div>
          <div className="stat-title text-xs font-semibold uppercase text-base-content/60">
            Menu Items
          </div>
          <div className="stat-value text-2xl font-black text-secondary">
            {menuItemsCount || 0}
          </div>
          <div className="stat-desc text-xs mt-1">Dishes & accompaniments</div>
        </div>

        <div className="stat bg-base-100 rounded-2xl border border-base-300 shadow-xs">
          <div className="stat-figure text-accent">
            <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-accent" />
            </div>
          </div>
          <div className="stat-title text-xs font-semibold uppercase text-base-content/60">
            Total Orders
          </div>
          <div className="stat-value text-2xl font-black text-accent-content">
            {ordersCount || 0}
          </div>
          <div className="stat-desc text-xs mt-1">Customer orders placed</div>
        </div>
      </div>

      {/* Grid: Categories & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Categories Card */}
        <div className="card bg-base-100 border border-base-300 shadow-xs lg:col-span-1">
          <div className="card-body p-5">
            <div className="flex items-center justify-between mb-2">
              <h2 className="card-title text-base font-bold flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                Active Categories
              </h2>
              <Link
                href="/admin/categories"
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
              >
                Manage <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <p className="text-xs text-base-content/60 mb-3">
              Standard food taxonomy for vendors:
            </p>

            <div className="flex flex-col gap-2">
              {activeCategories && activeCategories.length > 0 ? (
                activeCategories.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-base-200/50 hover:bg-base-200 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
                        {c.display_order}
                      </span>
                      <span className="font-semibold">{c.name}</span>
                    </div>
                    <span
                      className={`badge badge-xs ${
                        c.is_active ? "badge-success" : "badge-ghost"
                      }`}
                    >
                      {c.is_active ? "Active" : "Disabled"}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-base-content/50 py-4 text-center">
                  No categories found.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Orders Card */}
        <div className="card bg-base-100 border border-base-300 shadow-xs lg:col-span-2">
          <div className="card-body p-5">
            <div className="flex items-center justify-between mb-2">
              <h2 className="card-title text-base font-bold flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-primary" />
                Recent Orders
              </h2>
              <Link
                href="/admin/orders"
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
              >
                All Orders <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <p className="text-xs text-base-content/60 mb-3">
              Latest transactions requiring vendor verification or dispatch:
            </p>

            {recentOrders && recentOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="table table-sm w-full text-xs">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Amount</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>Placed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((o) => (
                      <tr key={o.id}>
                        <td className="font-mono text-[11px] font-bold">
                          #{o.id.slice(0, 8)}
                        </td>
                        <td className="font-bold">₦{Number(o.total_amount).toLocaleString()}</td>
                        <td>{o.delivery_city}</td>
                        <td>
                          <span
                            className={`badge badge-xs font-semibold ${
                              o.status === "delivered"
                                ? "badge-success"
                                : o.status === "cancelled"
                                ? "badge-error"
                                : o.status === "payment_uploaded"
                                ? "badge-warning"
                                : "badge-info"
                            }`}
                          >
                            {o.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="text-base-content/60">
                          {new Date(o.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-base-200 flex items-center justify-center text-base-content/40 mb-2">
                  <Clock className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-base-content/70">
                  No orders placed yet
                </p>
                <p className="text-xs text-base-content/50 max-w-xs mt-1">
                  When customers make orders through vendor storefronts, they will appear here in real-time.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
