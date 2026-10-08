"use client";

import { useState, useMemo } from "react";
import {
  BarChart3,
  Calendar,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Clock,
  Printer,
  ChevronRight,
  Utensils,
  Award,
  ArrowUpRight,
} from "lucide-react";
import type { Database } from "@/types/database.types";

type Order = Database["public"]["Tables"]["orders"]["Row"] & {
  order_items?: Database["public"]["Tables"]["order_items"]["Row"][];
};

type Period = "today" | "yesterday" | "weekly" | "monthly";

interface Props {
  initialOrders: Order[];
  businessName: string;
}

export default function VendorSalesClient({ initialOrders, businessName }: Props) {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("today");

  // Filter orders by period (excluding cancelled & rejected)
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return initialOrders.filter((order) => {
      // Only count valid, non-rejected orders in sales
      if (order.status === "cancelled" || order.status === "rejected") {
        return false;
      }

      const orderDate = new Date(order.created_at);

      if (selectedPeriod === "today") {
        return orderDate >= startOfToday;
      }
      if (selectedPeriod === "yesterday") {
        return orderDate >= startOfYesterday && orderDate < startOfToday;
      }
      if (selectedPeriod === "weekly") {
        return orderDate >= sevenDaysAgo;
      }
      if (selectedPeriod === "monthly") {
        return orderDate >= thirtyDaysAgo;
      }
      return true;
    });
  }, [initialOrders, selectedPeriod]);

  // Aggregate metrics
  const totalRevenue = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  }, [filteredOrders]);

  const totalOrders = filteredOrders.length;

  const averageOrderValue = useMemo(() => {
    return totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  }, [totalRevenue, totalOrders]);

  // Top selling dishes in this period
  const dishBreakdown = useMemo(() => {
    const map = new Map<string, { name: string; quantity: number; revenue: number }>();

    for (const order of filteredOrders) {
      if (order.order_items) {
        for (const item of order.order_items) {
          const existing = map.get(item.item_name) || {
            name: item.item_name,
            quantity: 0,
            revenue: 0,
          };
          existing.quantity += item.quantity;
          existing.revenue += Number(item.subtotal || 0);
          map.set(item.item_name, existing);
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => b.quantity - a.quantity);
  }, [filteredOrders]);

  const topDish = dishBreakdown[0] || null;

  const periodLabels: Record<Period, { title: string; subtitle: string }> = {
    today: {
      title: "Today's Sales",
      subtitle: "Orders placed since midnight today",
    },
    yesterday: {
      title: "Yesterday's Sales",
      subtitle: "Orders placed throughout yesterday",
    },
    weekly: {
      title: "Weekly Sales (Past 7 Days)",
      subtitle: "Sales performance over the last 7 days",
    },
    monthly: {
      title: "Monthly Sales (Past 30 Days)",
      subtitle: "Sales performance over the last 30 days",
    },
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-base-content flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Sales Report
          </h1>
          <p className="text-xs sm:text-sm text-base-content/60 mt-0.5">
            {periodLabels[selectedPeriod].subtitle}
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="btn btn-ghost btn-sm border border-base-200 self-start sm:self-auto rounded-xl gap-2 text-xs font-bold"
        >
          <Printer className="w-4 h-4" />
          <span>Print Report</span>
        </button>
      </div>

      {/* Period Filter Tabs */}
      <div className="flex gap-2 p-1.5 bg-base-100 rounded-2xl border border-base-200 shadow-xs max-w-xl">
        {(["today", "yesterday", "weekly", "monthly"] as Period[]).map((period) => {
          const labels: Record<Period, string> = {
            today: "Today",
            yesterday: "Yesterday",
            weekly: "Weekly",
            monthly: "Monthly",
          };

          const isActive = selectedPeriod === period;

          return (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`btn btn-xs sm:btn-sm flex-1 rounded-xl font-bold transition-all ${
                isActive
                  ? "btn-primary text-white shadow-xs"
                  : "btn-ghost text-base-content/70 hover:bg-base-200/60"
              }`}
            >
              {labels[period]}
            </button>
          );
        })}
      </div>

      {/* Metric Cards Row (Compact Height) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
        {/* Total Revenue */}
        <div className="card bg-base-100 border border-base-200 py-3 px-4 rounded-xl sm:rounded-2xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-[11px] font-bold text-base-content/60 uppercase tracking-wider truncate">
              {selectedPeriod === "today"
                ? "Today's Revenue"
                : selectedPeriod === "yesterday"
                ? "Yesterday's Revenue"
                : selectedPeriod === "weekly"
                ? "7-Day Revenue"
                : "30-Day Revenue"}
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
              ₦
            </div>
          </div>
          <div className="mt-1">
            <div className="text-xl sm:text-2xl font-black text-base-content tracking-tight leading-tight">
              ₦{totalRevenue.toLocaleString()}
            </div>
            <div className="text-[10px] text-base-content/50 mt-0.5">
              From {totalOrders} completed order{totalOrders === 1 ? "" : "s"}
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="card bg-base-100 border border-base-200 py-3 px-4 rounded-xl sm:rounded-2xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-[11px] font-bold text-base-content/60 uppercase tracking-wider truncate">
              Total Orders
            </span>
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ShoppingBag className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1">
            <div className="text-xl sm:text-2xl font-black text-base-content tracking-tight leading-tight">
              {totalOrders}
            </div>
            <div className="text-[10px] text-base-content/50 mt-0.5">
              Confirmed customer orders
            </div>
          </div>
        </div>

        {/* Average Order Value */}
        <div className="card bg-base-100 border border-base-200 py-3 px-4 rounded-xl sm:rounded-2xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-[11px] font-bold text-base-content/60 uppercase tracking-wider truncate">
              Avg. Order Value
            </span>
            <div className="w-7 h-7 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1">
            <div className="text-xl sm:text-2xl font-black text-base-content tracking-tight leading-tight">
              ₦{averageOrderValue.toLocaleString()}
            </div>
            <div className="text-[10px] text-base-content/50 mt-0.5">
              Average ticket size per order
            </div>
          </div>
        </div>
      </div>

      {/* Top Selling Dishes Summary */}
      {dishBreakdown.length > 0 && (
        <div className="card bg-base-100 border border-base-200 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-base-200 mb-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <h2 className="font-black text-base text-base-content">
                Top Selling Dishes ({periodLabels[selectedPeriod].title})
              </h2>
            </div>
            <span className="text-xs text-base-content/50">
              {dishBreakdown.length} item{dishBreakdown.length === 1 ? "" : "s"} sold
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {dishBreakdown.slice(0, 6).map((dish, idx) => (
              <div
                key={dish.name}
                className="p-3 bg-base-200/50 rounded-xl flex items-center justify-between gap-3 border border-base-200/60"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="badge badge-xs badge-primary font-bold text-[9px]">
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-xs text-base-content truncate">
                      {dish.name}
                    </span>
                  </div>
                  <span className="text-[11px] text-base-content/60 block mt-0.5">
                    {dish.quantity} portion{dish.quantity === 1 ? "" : "s"} ordered
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-black text-xs text-primary block">
                    ₦{dish.revenue.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Orders Log for this Period */}
      <div className="card bg-base-100 border border-base-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-base-200 flex items-center justify-between">
          <div>
            <h2 className="font-black text-base text-base-content">
              Orders Log ({filteredOrders.length})
            </h2>
            <p className="text-xs text-base-content/50">
              Itemized list of customer orders for {selectedPeriod}
            </p>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-base-200 flex items-center justify-center mx-auto mb-3 text-base-content/40">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-base-content">
              No sales recorded for {selectedPeriod}
            </h3>
            <p className="text-xs text-base-content/50 mt-1 max-w-sm mx-auto">
              Orders placed and confirmed during this period will automatically calculate into your revenue report.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-base-200">
            {filteredOrders.map((order) => {
              const orderTime = new Date(order.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });
              const orderDate = new Date(order.created_at).toLocaleDateString([], {
                month: "short",
                day: "numeric",
              });

              return (
                <div
                  key={order.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-base-200/30 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-xs text-base-content">
                        #{order.id.slice(0, 8)}
                      </span>
                      <span className="text-[11px] text-base-content/50 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {orderDate} at {orderTime}
                      </span>
                      <span
                        className={`badge badge-xs font-bold uppercase text-[9px] ${
                          order.status === "delivered"
                            ? "badge-success text-white"
                            : order.status === "preparing"
                            ? "badge-primary"
                            : "badge-ghost"
                        }`}
                      >
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </div>

                    {/* Ordered Items summary */}
                    {order.order_items && order.order_items.length > 0 && (
                      <div className="text-xs text-base-content/80 font-medium">
                        {order.order_items.map((item) => `${item.quantity}x ${item.item_name}`).join(", ")}
                      </div>
                    )}

                    <div className="text-[11px] text-base-content/50">
                      Phone: {order.contact_phone || "N/A"} • {order.delivery_city_area || "Pickup"}
                    </div>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <div className="text-base font-black text-primary">
                      ₦{Number(order.total_amount).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-base-content/50">
                      Payment via Bank Transfer
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
