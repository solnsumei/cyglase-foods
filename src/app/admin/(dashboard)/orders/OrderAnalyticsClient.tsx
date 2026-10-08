"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Truck,
  Store,
  MapPin,
  TrendingUp,
  Search,
} from "lucide-react";
import type { OrderStatus } from "@/types/database.types";

interface MinimalOrder {
  id: string;
  vendor_id: string;
  status: OrderStatus | string;
  delivery_city?: string | null;
  created_at: string;
}

interface VendorSummary {
  id: string;
  business_name: string;
  city_area?: string | null;
  city?: string | null;
}

export default function OrderAnalyticsClient({
  orders,
  vendors,
}: {
  orders: MinimalOrder[];
  vendors: VendorSummary[];
}) {
  const [vendorSearch, setVendorSearch] = useState("");

  // Aggregate metrics
  const metrics = useMemo(() => {
    const total = orders.length;
    let fulfilled = 0;
    let inProgress = 0; // preparing, out_for_delivery
    let pending = 0; // pending_acceptance, awaiting_payment, payment_uploaded
    let cancelled = 0; // cancelled, rejected

    const statusCounts: Record<string, number> = {
      delivered: 0,
      preparing: 0,
      out_for_delivery: 0,
      payment_uploaded: 0,
      awaiting_payment: 0,
      pending_acceptance: 0,
      cancelled: 0,
      rejected: 0,
    };

    orders.forEach((o) => {
      const s = o.status;
      if (statusCounts[s] !== undefined) {
        statusCounts[s]++;
      } else {
        statusCounts[s] = 1;
      }

      if (s === "delivered") {
        fulfilled++;
      } else if (s === "preparing" || s === "out_for_delivery") {
        inProgress++;
      } else if (s === "cancelled" || s === "rejected") {
        cancelled++;
      } else {
        pending++;
      }
    });

    const fulfillmentRate = total > 0 ? ((fulfilled / total) * 100).toFixed(1) : "0.0";

    return {
      total,
      fulfilled,
      inProgress,
      pending,
      cancelled,
      fulfillmentRate,
      statusCounts,
    };
  }, [orders]);

  // Breakdown by vendor (counts only, no phone numbers, no personal info)
  const vendorBreakdown = useMemo(() => {
    const map = new Map<
      string,
      {
        vendorId: string;
        vendorName: string;
        location: string;
        total: number;
        fulfilled: number;
        inProgress: number;
        pending: number;
        cancelled: number;
      }
    >();

    // Seed all registered vendors
    vendors.forEach((v) => {
      map.set(v.id, {
        vendorId: v.id,
        vendorName: v.business_name,
        location: [v.city_area, v.city].filter(Boolean).join(", ") || "Unassigned",
        total: 0,
        fulfilled: 0,
        inProgress: 0,
        pending: 0,
        cancelled: 0,
      });
    });

    // Count vendor orders
    orders.forEach((o) => {
      let entry = map.get(o.vendor_id);
      if (!entry) {
        entry = {
          vendorId: o.vendor_id,
          vendorName: "Unknown Vendor",
          location: "Unknown",
          total: 0,
          fulfilled: 0,
          inProgress: 0,
          pending: 0,
          cancelled: 0,
        };
        map.set(o.vendor_id, entry);
      }
      entry.total++;
      if (o.status === "delivered") {
        entry.fulfilled++;
      } else if (o.status === "preparing" || o.status === "out_for_delivery") {
        entry.inProgress++;
      } else if (o.status === "cancelled" || o.status === "rejected") {
        entry.cancelled++;
      } else {
        entry.pending++;
      }
    });

    const list = Array.from(map.values()).sort((a, b) => b.total - a.total);
    if (!vendorSearch.trim()) return list;
    const q = vendorSearch.toLowerCase().trim();
    return list.filter(
      (v) =>
        v.vendorName.toLowerCase().includes(q) ||
        v.location.toLowerCase().includes(q)
    );
  }, [orders, vendors, vendorSearch]);

  // Location breakdown
  const cityBreakdown = useMemo(() => {
    const map = new Map<string, { total: number; fulfilled: number }>();
    orders.forEach((o) => {
      const city = o.delivery_city?.trim() || "Unspecified";
      const entry = map.get(city) || { total: 0, fulfilled: 0 };
      entry.total++;
      if (o.status === "delivered") entry.fulfilled++;
      map.set(city, entry);
    });
    return Array.from(map.entries())
      .map(([city, data]) => ({
        city,
        total: data.total,
        fulfilled: data.fulfilled,
        rate: data.total > 0 ? ((data.fulfilled / data.total) * 100).toFixed(0) : "0",
      }))
      .sort((a, b) => b.total - a.total);
  }, [orders]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Order & Fulfillment Analytics
          </h1>
          <p className="text-xs text-base-content/60 mt-1">
            Platform-wide order volumes, fulfillment rates, and kitchen throughput.
          </p>
        </div>

        <div className="badge badge-primary badge-outline gap-1.5 py-3 text-xs font-bold">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{metrics.fulfillmentRate}% Overall Fulfillment</span>
        </div>
      </div>

      {/* Top Level Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Total Orders */}
        <div className="card bg-base-100 border border-base-300 shadow-xs">
          <div className="card-body p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-base-content/60 uppercase">
                Total Orders
              </span>
              <div className="w-7 h-7 rounded-lg bg-base-200 flex items-center justify-center text-base-content/70">
                <BarChart3 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black mt-1">
              {metrics.total}
            </div>
            <span className="text-[11px] text-base-content/50">All platform transactions</span>
          </div>
        </div>

        {/* Fulfilled Orders */}
        <div className="card bg-base-100 border border-base-300 shadow-xs">
          <div className="card-body p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-success uppercase">
                Fulfilled Orders
              </span>
              <div className="w-7 h-7 rounded-lg bg-success/15 flex items-center justify-center text-success">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-success mt-1">
              {metrics.fulfilled}
            </div>
            <span className="text-[11px] text-base-content/50">
              {metrics.fulfillmentRate}% completed
            </span>
          </div>
        </div>

        {/* In Progress / Active */}
        <div className="card bg-base-100 border border-base-300 shadow-xs">
          <div className="card-body p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-primary uppercase">
                In Kitchen / Transit
              </span>
              <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center text-primary">
                <Truck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-primary mt-1">
              {metrics.inProgress}
            </div>
            <span className="text-[11px] text-base-content/50">Cooking or out for delivery</span>
          </div>
        </div>

        {/* Awaiting / Pending */}
        <div className="card bg-base-100 border border-base-300 shadow-xs">
          <div className="card-body p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-warning uppercase">
                Pending Action
              </span>
              <div className="w-7 h-7 rounded-lg bg-warning/15 flex items-center justify-center text-warning">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-warning mt-1">
              {metrics.pending}
            </div>
            <span className="text-[11px] text-base-content/50">Awaiting kitchen or payment</span>
          </div>
        </div>

        {/* Cancelled / Rejected */}
        <div className="card bg-base-100 border border-base-300 shadow-xs col-span-2 lg:col-span-1">
          <div className="card-body p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-error uppercase">
                Cancelled
              </span>
              <div className="w-7 h-7 rounded-lg bg-error/15 flex items-center justify-center text-error">
                <XCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-error mt-1">
              {metrics.cancelled}
            </div>
            <span className="text-[11px] text-base-content/50">Declined or aborted</span>
          </div>
        </div>
      </div>

      {/* Status Breakdown & Fulfillment Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution Breakdown */}
        <div className="card bg-base-100 border border-base-300 shadow-xs lg:col-span-2">
          <div className="card-body p-5">
            <h2 className="card-title text-base font-bold flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-primary" />
              Detailed Status Distribution
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-success/10 border border-success/20">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-success">Delivered</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                </div>
                <div className="text-xl font-bold text-success mt-1">
                  {metrics.statusCounts.delivered || 0}
                </div>
                <span className="text-[10px] text-base-content/60">Fulfilled</span>
              </div>

              <div className="p-3 rounded-xl bg-secondary/10 border border-secondary/20">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-secondary">In Delivery</span>
                  <Truck className="w-3.5 h-3.5 text-secondary" />
                </div>
                <div className="text-xl font-bold text-secondary mt-1">
                  {metrics.statusCounts.out_for_delivery || 0}
                </div>
                <span className="text-[10px] text-base-content/60">With rider</span>
              </div>

              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-primary">Preparing</span>
                  <Clock className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="text-xl font-bold text-primary mt-1">
                  {metrics.statusCounts.preparing || 0}
                </div>
                <span className="text-[10px] text-base-content/60">In kitchen</span>
              </div>

              <div className="p-3 rounded-xl bg-accent/10 border border-accent/20">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-accent-content">Receipt Sent</span>
                  <AlertCircle className="w-3.5 h-3.5 text-accent-content" />
                </div>
                <div className="text-xl font-bold text-accent-content mt-1">
                  {metrics.statusCounts.payment_uploaded || 0}
                </div>
                <span className="text-[10px] text-base-content/60">Paid by customer</span>
              </div>

              <div className="p-3 rounded-xl bg-info/10 border border-info/20">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-info">Awaiting Pay</span>
                  <Clock className="w-3.5 h-3.5 text-info" />
                </div>
                <div className="text-xl font-bold text-info mt-1">
                  {metrics.statusCounts.awaiting_payment || 0}
                </div>
                <span className="text-[10px] text-base-content/60">Unpaid</span>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-amber-900 dark:text-amber-200">Awaiting Vendor</span>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300" />
                </div>
                <div className="text-xl font-bold text-amber-900 dark:text-amber-200 mt-1">
                  {metrics.statusCounts.pending_acceptance || 0}
                </div>
                <span className="text-[10px] text-base-content/60">Pending accept</span>
              </div>

              <div className="p-3 rounded-xl bg-error/10 border border-error/20">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-error">Cancelled</span>
                  <XCircle className="w-3.5 h-3.5 text-error" />
                </div>
                <div className="text-xl font-bold text-error mt-1">
                  {metrics.statusCounts.cancelled || 0}
                </div>
                <span className="text-[10px] text-base-content/60">By user/vendor</span>
              </div>

              <div className="p-3 rounded-xl bg-error/10 border border-error/20">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-error">Rejected</span>
                  <XCircle className="w-3.5 h-3.5 text-error" />
                </div>
                <div className="text-xl font-bold text-error mt-1">
                  {metrics.statusCounts.rejected || 0}
                </div>
                <span className="text-[10px] text-base-content/60">Declined</span>
              </div>
            </div>
          </div>
        </div>

        {/* Fulfillment Rate & Volume by City */}
        <div className="card bg-base-100 border border-base-300 shadow-xs lg:col-span-1">
          <div className="card-body p-5">
            <h2 className="card-title text-base font-bold flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-primary" />
              Volume by City
            </h2>

            <div className="flex flex-col gap-2 mt-1">
              {cityBreakdown.length > 0 ? (
                cityBreakdown.map((c) => (
                  <div
                    key={c.city}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-base-200/50 text-xs"
                  >
                    <div>
                      <div className="font-bold text-base-content">{c.city}</div>
                      <div className="text-[10px] text-base-content/60">
                        {c.fulfilled} of {c.total} fulfilled ({c.rate}%)
                      </div>
                    </div>
                    <div className="badge badge-sm font-mono font-bold">
                      {c.total} orders
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-base-content/50">
                  No city data available yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Orders by Vendor Kitchen Breakdown */}
      <div className="card bg-base-100 border border-base-300 shadow-xs">
        <div className="card-body p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
            <div>
              <h2 className="card-title text-base font-bold flex items-center gap-2">
                <Store className="w-4 h-4 text-primary" />
                Orders & Fulfillment by Vendor Kitchen
              </h2>
              <p className="text-xs text-base-content/60 mt-0.5">
                Aggregate order throughput per registered storefront.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
              <input
                type="text"
                value={vendorSearch}
                onChange={(e) => setVendorSearch(e.target.value)}
                placeholder="Search vendor or city..."
                className="input input-sm input-bordered w-full pl-9 text-xs"
              />
            </div>
          </div>

          <div className="overflow-x-auto mt-2">
            <table className="table table-zebra table-sm w-full text-xs">
              <thead className="bg-base-200/60 text-base-content/70">
                <tr>
                  <th>Vendor Kitchen</th>
                  <th>Area / Hub</th>
                  <th className="text-center">Total Orders</th>
                  <th className="text-center">Fulfilled</th>
                  <th className="text-center">In Progress</th>
                  <th className="text-center">Pending</th>
                  <th className="text-center">Cancelled</th>
                  <th className="text-right">Fulfillment Rate</th>
                </tr>
              </thead>
              <tbody>
                {vendorBreakdown.length > 0 ? (
                  vendorBreakdown.map((v) => {
                    const rate =
                      v.total > 0 ? ((v.fulfilled / v.total) * 100).toFixed(0) : "0";
                    return (
                      <tr key={v.vendorId} className="hover">
                        <td className="font-bold text-sm text-base-content">
                          {v.vendorName}
                        </td>
                        <td className="text-base-content/70">{v.location}</td>
                        <td className="text-center font-bold font-mono">
                          {v.total}
                        </td>
                        <td className="text-center font-bold font-mono text-success">
                          {v.fulfilled}
                        </td>
                        <td className="text-center font-bold font-mono text-primary">
                          {v.inProgress}
                        </td>
                        <td className="text-center font-bold font-mono text-warning">
                          {v.pending}
                        </td>
                        <td className="text-center font-bold font-mono text-error">
                          {v.cancelled}
                        </td>
                        <td className="text-right">
                          <span
                            className={`badge badge-sm font-bold font-mono ${
                              Number(rate) >= 80
                                ? "badge-success text-white"
                                : Number(rate) >= 50
                                ? "badge-warning"
                                : "badge-ghost"
                            }`}
                          >
                            {rate}%
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-base-content/50">
                      No vendors matched your query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
