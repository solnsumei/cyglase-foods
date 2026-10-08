"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  History,
  Search,
  Filter,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  MapPin,
  ExternalLink,
  Receipt,
  Utensils,
  X,
  FileText,
} from "lucide-react";
import type { Database } from "@/types/database.types";

type Order = Database["public"]["Tables"]["orders"]["Row"] & {
  order_items?: Database["public"]["Tables"]["order_items"]["Row"][];
};

interface Props {
  initialOrders: Order[];
  businessName: string;
}

const ITEMS_PER_PAGE = 10;

export default function VendorHistoryClient({ initialOrders, businessName }: Props) {
  const [orders] = useState<Order[]>(initialOrders);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Compute status counts
  const deliveredOrders = useMemo(() => orders.filter((o) => o.status === "delivered"), [orders]);
  const cancelledOrders = useMemo(() => orders.filter((o) => o.status === "cancelled"), [orders]);
  const rejectedOrders = useMemo(() => orders.filter((o) => o.status === "rejected"), [orders]);

  const totalDeliveredRevenue = useMemo(() => {
    return deliveredOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  }, [deliveredOrders]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // 1. Status Filter
      if (statusFilter === "delivered" && order.status !== "delivered") return false;
      if (statusFilter === "cancelled" && order.status !== "cancelled") return false;
      if (statusFilter === "rejected" && order.status !== "rejected") return false;
      if (
        statusFilter === "active" &&
        (order.status === "delivered" || order.status === "cancelled" || order.status === "rejected")
      ) {
        return false;
      }

      // 2. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesId = order.id.toLowerCase().includes(query);
        const matchesPhone = order.contact_phone?.toLowerCase().includes(query);
        const matchesArea = order.delivery_city_area?.toLowerCase().includes(query);
        const matchesAddress = order.delivery_address?.toLowerCase().includes(query);
        const matchesItems = order.order_items?.some((i) =>
          i.item_name.toLowerCase().includes(query)
        );

        if (!matchesId && !matchesPhone && !matchesArea && !matchesAddress && !matchesItems) {
          return false;
        }
      }

      return true;
    });
  }, [orders, statusFilter, searchQuery]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedOrders = useMemo(() => {
    const start = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOrders, safeCurrentPage]);

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/vendor"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Live Orders</span>
            </Link>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-base-content flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            <span>Historical Orders Archive</span>
          </h1>
          <p className="text-xs text-base-content/60 mt-0.5">
            Full record of all customer orders processed by {businessName}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/vendor/sales"
            className="btn btn-ghost btn-xs sm:btn-sm border border-base-200 rounded-xl gap-1 text-xs"
          >
            <span>Sales Report</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </Link>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="card bg-base-100 border border-base-200 p-3 sm:p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-bold text-base-content/60 uppercase tracking-wider block">
            Total All-Time
          </span>
          <div className="text-xl sm:text-2xl font-black text-base-content mt-0.5">
            {orders.length}
          </div>
          <div className="text-[10px] text-base-content/50 mt-0.5">Orders received</div>
        </div>

        <div className="card bg-base-100 border border-base-200 p-3 sm:p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-bold text-base-content/60 uppercase tracking-wider block">
            Fulfilled
          </span>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-0.5">
            {deliveredOrders.length}
          </div>
          <div className="text-[10px] text-base-content/50 mt-0.5">Successfully delivered</div>
        </div>

        <div className="card bg-base-100 border border-base-200 p-3 sm:p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-bold text-base-content/60 uppercase tracking-wider block">
            Cancelled / Rejected
          </span>
          <div className="text-xl sm:text-2xl font-black text-error mt-0.5">
            {cancelledOrders.length + rejectedOrders.length}
          </div>
          <div className="text-[10px] text-base-content/50 mt-0.5">Not completed</div>
        </div>

        <div className="card bg-base-100 border border-base-200 p-3 sm:p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-bold text-base-content/60 uppercase tracking-wider block">
            Fulfilled Volume
          </span>
          <div className="text-xl sm:text-2xl font-black text-primary mt-0.5">
            ₦{totalDeliveredRevenue.toLocaleString()}
          </div>
          <div className="text-[10px] text-base-content/50 mt-0.5">Gross delivered revenue</div>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="card bg-base-100 border border-base-200 p-3 sm:p-4 rounded-2xl shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search by order ID, phone, area, dish name..."
              className="input input-sm sm:input-md input-bordered w-full pl-10 rounded-xl text-xs sm:text-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-base-content/50 hover:text-base-content"
              >
                Clear
              </button>
            )}
          </div>

          {/* Status Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: "all", label: "All", count: orders.length },
              { id: "delivered", label: "Delivered", count: deliveredOrders.length },
              { id: "cancelled", label: "Cancelled", count: cancelledOrders.length },
              { id: "rejected", label: "Rejected", count: rejectedOrders.length },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleStatusChange(tab.id)}
                className={`btn btn-xs sm:btn-sm rounded-xl font-bold whitespace-nowrap transition-all ${
                  statusFilter === tab.id
                    ? "btn-primary text-white shadow-xs"
                    : "btn-ghost border border-base-200 text-base-content/70 hover:text-base-content"
                }`}
              >
                <span>{tab.label}</span>
                <span className="badge badge-xs bg-base-content/10 text-inherit ml-1">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Table & List */}
      <div className="card bg-base-100 border border-base-200 rounded-2xl shadow-xs overflow-hidden">
        {paginatedOrders.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <History className="w-10 h-10 text-base-content/30 mx-auto" />
            <h3 className="font-bold text-sm text-base-content">No historical orders found</h3>
            <p className="text-xs text-base-content/60 max-w-sm mx-auto">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your search query or status filter."
                : "No past orders have been placed with your kitchen yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-sm w-full text-left">
              <thead>
                <tr className="border-b border-base-200 bg-base-200/40 text-[11px] text-base-content/60 font-bold uppercase tracking-wider">
                  <th>Order ID</th>
                  <th>Date & Time</th>
                  <th>Customer / Area</th>
                  <th>Items Ordered</th>
                  <th>Status</th>
                  <th className="text-right">Total</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-200 text-xs">
                {paginatedOrders.map((order) => {
                  const itemsCount =
                    order.order_items?.reduce((sum, i) => sum + i.quantity, 0) || 0;
                  const formattedDate = new Date(order.created_at).toLocaleString("en-NG", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <tr key={order.id} className="hover:bg-base-200/30 transition-colors">
                      {/* ID */}
                      <td className="font-mono font-bold text-base-content">
                        #{order.id.slice(0, 8)}
                      </td>

                      {/* Date */}
                      <td className="text-base-content/70 whitespace-nowrap">
                        {formattedDate}
                      </td>

                      {/* Customer info */}
                      <td>
                        <div className="font-medium text-base-content">
                          {order.contact_phone || "N/A"}
                        </div>
                        <div className="text-[11px] text-base-content/50">
                          {order.delivery_city_area || "Pickup"}
                        </div>
                      </td>

                      {/* Items */}
                      <td className="max-w-[220px]">
                        <div className="font-medium text-base-content truncate">
                          {order.order_items?.map((i) => `${i.quantity}x ${i.item_name}`).join(", ") ||
                            "No item breakdown"}
                        </div>
                        <div className="text-[10px] text-base-content/50">
                          {itemsCount} portion{itemsCount === 1 ? "" : "s"}
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <span
                          className={`badge badge-xs font-bold uppercase text-[9px] px-2 py-1 ${
                            order.status === "delivered"
                              ? "badge-success text-white"
                              : order.status === "cancelled" || order.status === "rejected"
                              ? "badge-error text-white"
                              : order.status === "in_transit" || order.status === "preparing"
                              ? "badge-primary text-white"
                              : "badge-warning"
                          }`}
                        >
                          {order.status.replace(/_/g, " ")}
                        </span>
                      </td>

                      {/* Total */}
                      <td className="text-right font-black text-sm text-base-content whitespace-nowrap">
                        ₦{Number(order.total_amount || 0).toLocaleString()}
                      </td>

                      {/* Action */}
                      <td className="text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="btn btn-ghost btn-xs rounded-lg gap-1 border border-base-200 font-bold"
                          title="Inspect order details"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {filteredOrders.length > 0 && (
          <div className="p-3 sm:p-4 border-t border-base-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="text-base-content/60">
              Showing{" "}
              <span className="font-bold text-base-content">
                {(safeCurrentPage - 1) * ITEMS_PER_PAGE + 1}
              </span>{" "}
              to{" "}
              <span className="font-bold text-base-content">
                {Math.min(safeCurrentPage * ITEMS_PER_PAGE, filteredOrders.length)}
              </span>{" "}
              of <span className="font-bold text-base-content">{filteredOrders.length}</span> orders
            </div>

            <div className="flex items-center gap-1.5 self-center sm:self-auto">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage <= 1}
                className="btn btn-xs sm:btn-sm btn-ghost border border-base-200 rounded-xl gap-1 disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>

              <div className="px-2 font-bold text-base-content">
                Page {safeCurrentPage} of {totalPages}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage >= totalPages}
                className="btn btn-xs sm:btn-sm btn-ghost border border-base-200 rounded-xl gap-1 disabled:opacity-40"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="card bg-base-100 border border-base-200 shadow-2xl rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-base-200">
              <div>
                <h3 className="font-black text-base text-base-content flex items-center gap-2">
                  <span>Order #{selectedOrder.id.slice(0, 8)}</span>
                  <span
                    className={`badge badge-xs font-bold uppercase text-[9px] px-2 py-0.5 ${
                      selectedOrder.status === "delivered"
                        ? "badge-success text-white"
                        : selectedOrder.status === "cancelled" || selectedOrder.status === "rejected"
                        ? "badge-error text-white"
                        : "badge-warning"
                    }`}
                  >
                    {selectedOrder.status.replace(/_/g, " ")}
                  </span>
                </h3>
                <p className="text-[11px] text-base-content/60 mt-0.5">
                  Placed on {new Date(selectedOrder.created_at).toLocaleString("en-NG")}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="btn btn-ghost btn-xs btn-circle text-base-content/50 hover:text-base-content"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Line items list */}
            <div>
              <h4 className="text-xs font-bold text-base-content uppercase tracking-wider mb-2">
                Order Items ({selectedOrder.order_items?.length || 0})
              </h4>
              <div className="divide-y divide-base-200 rounded-2xl border border-base-200 overflow-hidden bg-base-200/30">
                {selectedOrder.order_items?.map((item) => (
                  <div key={item.id} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-base-content">
                        {item.quantity}x {item.item_name}
                      </div>
                      {item.special_instructions && (
                        <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                          Note: {item.special_instructions}
                        </div>
                      )}
                    </div>
                    <div className="font-bold text-base-content">
                      ₦{Number(item.subtotal || 0).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Price breakdown */}
            <div className="bg-base-200/40 p-3.5 rounded-2xl border border-base-200 space-y-1.5 text-xs">
              <div className="flex justify-between text-base-content/70">
                <span>Items Subtotal</span>
                <span>₦{Number(selectedOrder.subtotal || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-base-content/70">
                <span>Delivery Fee</span>
                <span>₦{Number(selectedOrder.delivery_fee || 0).toLocaleString()}</span>
              </div>
              <div className="border-t border-base-200 pt-1.5 flex justify-between font-black text-sm text-base-content">
                <span>Total Amount</span>
                <span className="text-primary">
                  ₦{Number(selectedOrder.total_amount || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Delivery & Customer Info */}
            <div className="bg-base-200/40 p-3.5 rounded-2xl border border-base-200 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-base-content font-bold">
                <Phone className="w-3.5 h-3.5 text-primary" />
                <span>Customer Phone: {selectedOrder.contact_phone || "Not provided"}</span>
              </div>

              <div className="flex items-start gap-2 text-base-content/80">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">{selectedOrder.delivery_address}</span>
                  {selectedOrder.delivery_landmark && (
                    <span className="block text-[11px] text-base-content/60">
                      Landmark: {selectedOrder.delivery_landmark}
                    </span>
                  )}
                  <span className="block text-[11px] text-base-content/60">
                    {selectedOrder.delivery_city_area}, {selectedOrder.delivery_state}
                  </span>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="pt-1 text-[11px] text-base-content/70">
                  <span className="font-bold">Customer Notes:</span> {selectedOrder.notes}
                </div>
              )}

              {selectedOrder.cancellation_reason && (
                <div className="pt-1 text-[11px] text-error font-medium">
                  <span className="font-bold">Cancellation Reason:</span> {selectedOrder.cancellation_reason}
                </div>
              )}
            </div>

            {/* Receipt Proof (if attached) */}
            {selectedOrder.payment_receipt_url && (
              <div className="p-3 bg-base-200/50 rounded-2xl border border-base-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-primary" />
                  <span className="font-medium text-base-content">Bank Payment Receipt</span>
                </div>
                <a
                  href={selectedOrder.payment_receipt_url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-xs btn-outline rounded-lg gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>View Proof</span>
                </a>
              </div>
            )}

            <button
              type="button"
              onClick={() => setSelectedOrder(null)}
              className="btn btn-primary btn-sm w-full rounded-xl text-white font-bold"
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
