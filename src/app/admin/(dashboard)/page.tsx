import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import {
  Layers,
  Store,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  BarChart3,
  XCircle,
  Truck,
  AlertCircle,
} from "lucide-react";

export default async function AdminDashboardPage() {
  const adminClient = createAdminClient();

  // Fetch aggregate counts and status summaries
  const [
    { count: categoriesCount },
    { count: vendorsCount },
    { count: ordersCount },
    { count: fulfilledOrdersCount },
    { data: orderStatuses },
    { data: activeCategories },
  ] = await Promise.all([
    adminClient.from("categories").select("*", { count: "exact", head: true }),
    adminClient.from("vendors").select("*", { count: "exact", head: true }),
    adminClient.from("orders").select("*", { count: "exact", head: true }),
    adminClient
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "delivered"),
    adminClient.from("orders").select("status"),
    adminClient
      .from("categories")
      .select("id, name, slug, is_active, display_order")
      .order("display_order", { ascending: true })
      .limit(7),
  ]);

  const total = ordersCount || 0;
  const fulfilled = fulfilledOrdersCount || 0;
  const fulfillmentRate = total > 0 ? ((fulfilled / total) * 100).toFixed(1) : "0.0";

  let inProgress = 0; // preparing, out_for_delivery
  let pending = 0; // pending_acceptance, awaiting_payment, payment_uploaded
  let cancelled = 0; // cancelled, rejected

  if (orderStatuses) {
    orderStatuses.forEach((o) => {
      const s = o.status;
      if (s === "preparing" || s === "out_for_delivery") {
        inProgress++;
      } else if (s === "cancelled" || s === "rejected") {
        cancelled++;
      } else if (s !== "delivered") {
        pending++;
      }
    });
  }

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
            Platform catalog control, vendor directory, and high-level fulfillment tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/categories" className="btn btn-warning btn-sm font-bold shadow-sm">
            <Layers className="w-4 h-4" />
            Manage Categories
          </Link>
          <Link href="/admin/orders" className="btn btn-neutral btn-sm font-bold">
            <BarChart3 className="w-4 h-4" />
            Order Analytics
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Categories */}
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

        {/* Vendors */}
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
          <div className="stat-desc text-xs mt-1">Active kitchens & sellers</div>
        </div>

        {/* Fulfilled Orders */}
        <div className="stat bg-base-100 rounded-2xl border border-base-300 shadow-xs">
          <div className="stat-figure text-success">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
          </div>
          <div className="stat-title text-xs font-semibold uppercase text-success">
            Fulfilled Orders
          </div>
          <div className="stat-value text-2xl font-black text-success">
            {fulfilled}
          </div>
          <div className="stat-desc text-xs mt-1 font-semibold text-success">
            {fulfillmentRate}% completion rate
          </div>
        </div>

        {/* Total Orders */}
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
            {total}
          </div>
          <div className="stat-desc text-xs mt-1">Platform customer orders</div>
        </div>
      </div>

      {/* Grid: Categories & Order Fulfillment Overview */}
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

        {/* Order Fulfillment & Volume Summary */}
        <div className="card bg-base-100 border border-base-300 shadow-xs lg:col-span-2">
          <div className="card-body p-5">
            <div className="flex items-center justify-between mb-2">
              <h2 className="card-title text-base font-bold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Order Fulfillment Overview
              </h2>
              <Link
                href="/admin/orders"
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
              >
                Detailed Analytics <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <p className="text-xs text-base-content/60 mb-4">
              Real-time delivery fulfillment breakdown across all vendor kitchens:
            </p>

            {/* Progress Bar */}
            <div className="p-4 rounded-2xl bg-base-200/60 border border-base-200 mb-4">
              <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
                <span className="text-base-content/70">Overall Completion</span>
                <span className="text-success">{fulfillmentRate}% Fulfilled ({fulfilled}/{total})</span>
              </div>
              <div className="w-full bg-base-300 rounded-full h-3 overflow-hidden flex">
                <div
                  className="bg-success transition-all duration-500"
                  style={{ width: `${fulfillmentRate}%` }}
                ></div>
                <div
                  className="bg-primary/70 transition-all duration-500"
                  style={{
                    width: total > 0 ? `${(inProgress / total) * 100}%` : "0%",
                  }}
                ></div>
                <div
                  className="bg-warning/70 transition-all duration-500"
                  style={{
                    width: total > 0 ? `${(pending / total) * 100}%` : "0%",
                  }}
                ></div>
              </div>
            </div>

            {/* Status Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-success/10 border border-success/20">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-success">Fulfilled</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                </div>
                <div className="text-xl font-black text-success mt-1">{fulfilled}</div>
                <span className="text-[10px] text-base-content/60">Delivered</span>
              </div>

              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-primary">In Kitchen</span>
                  <Truck className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="text-xl font-black text-primary mt-1">{inProgress}</div>
                <span className="text-[10px] text-base-content/60">Cooking/Transit</span>
              </div>

              <div className="p-3 rounded-xl bg-warning/10 border border-warning/20">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-warning-content">Pending</span>
                  <AlertCircle className="w-3.5 h-3.5 text-warning-content" />
                </div>
                <div className="text-xl font-black text-warning-content mt-1">{pending}</div>
                <span className="text-[10px] text-base-content/60">Action Needed</span>
              </div>

              <div className="p-3 rounded-xl bg-error/10 border border-error/20">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-error">Cancelled</span>
                  <XCircle className="w-3.5 h-3.5 text-error" />
                </div>
                <div className="text-xl font-black text-error mt-1">{cancelled}</div>
                <span className="text-[10px] text-base-content/60">Aborted</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-base-200 flex justify-end">
              <Link
                href="/admin/orders"
                className="btn btn-sm btn-ghost text-primary text-xs font-bold gap-1.5"
              >
                <span>View Store & City Breakdown</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
