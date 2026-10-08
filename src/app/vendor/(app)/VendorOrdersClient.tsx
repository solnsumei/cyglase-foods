"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  acceptOrder,
  rejectOrder,
  confirmOrderPayment,
  updateOrderFulfillment,
} from "../actions";
import {
  ShoppingBag,
  Clock,
  MapPin,
  Phone,
  FileText,
  Check,
  X,
  Eye,
  AlertCircle,
  Truck,
  History,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";
import type { Database, OrderStatus } from "@/types/database.types";

type Order = Database["public"]["Tables"]["orders"]["Row"] & {
  order_items?: Database["public"]["Tables"]["order_items"]["Row"][];
};

export default function VendorOrdersClient({
  initialOrders,
}: {
  initialOrders: Order[];
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [rejectingOrderId, setRejectingOrderId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [alertInfo, setAlertInfo] = useState<{ title: string; message: string } | null>(null);

  const actionRequiredOrders = orders.filter(
    (o) =>
      o.status === "pending_acceptance" ||
      o.status === "awaiting_payment" ||
      o.status === "payment_uploaded"
  );

  const inKitchenOrders = orders.filter(
    (o) => o.status === "preparing" || o.status === "out_for_delivery"
  );

  const [searchQuery, setSearchQuery] = useState("");

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return orders;

    return orders.filter((order) => {
      // 1. Order ID match
      if (order.id.toLowerCase().includes(q)) return true;
      // 2. Customer Phone match
      if (order.contact_phone && order.contact_phone.toLowerCase().includes(q)) return true;
      // 3. Address match
      if (order.delivery_city_area && order.delivery_city_area.toLowerCase().includes(q)) return true;
      if (order.delivery_city && order.delivery_city.toLowerCase().includes(q)) return true;
      if (order.delivery_address && order.delivery_address.toLowerCase().includes(q)) return true;
      if (order.delivery_landmark && order.delivery_landmark.toLowerCase().includes(q)) return true;
      // 4. Notes match
      if (order.notes && order.notes.toLowerCase().includes(q)) return true;
      // 5. Items in order match
      if (
        order.order_items &&
        order.order_items.some((item) =>
          item.item_name.toLowerCase().includes(q)
        )
      ) {
        return true;
      }
      return false;
    });
  }, [orders, searchQuery]);

  const ORDERS_PER_PAGE = 8;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE) || 1;
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ORDERS_PER_PAGE,
    currentPage * ORDERS_PER_PAGE
  );

  const handleAccept = async (orderId: string) => {
    setIsProcessing(orderId);
    const res = await acceptOrder(orderId);
    setIsProcessing(null);
    if (res?.error) {
      setAlertInfo({ title: "Cannot Accept Order", message: res.error });
    } else {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: "awaiting_payment" } : o))
      );
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingOrderId) return;
    setIsProcessing(rejectingOrderId);
    const res = await rejectOrder(rejectingOrderId, rejectReason);
    setIsProcessing(null);
    if (res?.error) {
      setAlertInfo({ title: "Cannot Reject Order", message: res.error });
    } else {
      setOrders((prev) =>
        prev.map((o) => (o.id === rejectingOrderId ? { ...o, status: "rejected" } : o))
      );
      setRejectingOrderId(null);
      setRejectReason("");
    }
  };

  const handleConfirmPayment = async (orderId: string) => {
    setIsProcessing(orderId);
    const res = await confirmOrderPayment(orderId);
    setIsProcessing(null);
    if (res?.error) {
      setAlertInfo({ title: "Payment Confirmation Error", message: res.error });
    } else {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: "preparing" } : o))
      );
    }
  };

  const handleFulfillment = async (
    orderId: string,
    status: "out_for_delivery" | "delivered"
  ) => {
    setIsProcessing(orderId);
    const res = await updateOrderFulfillment(orderId, status);
    setIsProcessing(null);
    if (res?.error) {
      setAlertInfo({ title: "Fulfillment Update Error", message: res.error });
    } else {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
    }
  };

  const deliveredCount = orders.filter((o) => o.status === "delivered").length;

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header & Live Order Stats (Desktop & Mobile) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-base-content flex items-center gap-2">
            <span>Kitchen Orders</span>
            <span className="badge badge-sm badge-primary font-bold">Live</span>
          </h1>
          <p className="text-xs text-base-content/60 mt-0.5">
            Manage incoming food requests, verify customer bank receipts, and update delivery status.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <Link
            href="/vendor/history"
            className="btn btn-ghost btn-xs sm:btn-sm border border-base-200 rounded-xl gap-1.5 text-xs text-base-content/80 hover:text-base-content hover:bg-base-200 font-semibold"
            title="View all past and historical orders"
          >
            <History className="w-3.5 h-3.5 text-primary" />
            <span>Order History</span>
          </Link>

          <button
            onClick={() => window.location.reload()}
            className="btn btn-ghost btn-xs sm:btn-sm border border-base-200 rounded-xl gap-1.5 text-xs text-base-content/70 hover:text-base-content"
            title="Refresh orders list"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Operational Order Stats (Compact Height):
          - Desktop (md:): All 3 cards side-by-side in one compact row
          - Mobile (< md): Action Needed + Fulfilled 2 in a row, Cooking / Transit full width on its own row
      */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
        {/* Card 1: Action Needed (Mobile: Row 1 Left | Desktop: Col 1) */}
        <div className="card bg-base-100 border border-base-200 py-2.5 px-3.5 sm:py-3 sm:px-4 rounded-xl sm:rounded-2xl shadow-xs col-span-1 order-1 flex flex-row items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-base-content/60 uppercase tracking-wider block truncate">
              Action Needed
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-400 tracking-tight leading-none">
                {actionRequiredOrders.length}
              </span>
              <span className="text-[10px] text-base-content/50 hidden sm:inline">review</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>

        {/* Card 2: Cooking / Transit (Mobile: Row 2 Full Width | Desktop: Col 2) */}
        <div className="card bg-base-100 border border-base-200 py-2.5 px-3.5 sm:py-3 sm:px-4 rounded-xl sm:rounded-2xl shadow-xs col-span-2 md:col-span-1 order-3 md:order-2 flex flex-row items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-base-content/60 uppercase tracking-wider block truncate">
              Cooking / Transit
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-primary tracking-tight leading-none">
                {inKitchenOrders.length}
              </span>
              <span className="text-[10px] text-base-content/50 hidden sm:inline">in progress</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Truck className="w-4 h-4" />
          </div>
        </div>

        {/* Card 3: Fulfilled (Mobile: Row 1 Right | Desktop: Col 3) */}
        <div className="card bg-base-100 border border-base-200 py-2.5 px-3.5 sm:py-3 sm:px-4 rounded-xl sm:rounded-2xl shadow-xs col-span-1 order-2 md:order-3 flex flex-row items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-base-content/60 uppercase tracking-wider block truncate">
              Fulfilled
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-emerald-600 tracking-tight leading-none">
                {deliveredCount}
              </span>
              <span className="text-[10px] text-base-content/50 hidden sm:inline">delivered</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <Check className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Orders Real-time Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Search orders by ID, dish name, phone, or address..."
          className="input input-bordered w-full pl-10 text-sm rounded-xl bg-base-100 shadow-sm"
        />
        {searchQuery && (
          <button
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

      {/* Orders Grid (1 col mobile, 2 cols on tablet/desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {paginatedOrders.length > 0 ? (
          paginatedOrders.map((order) => {
            const isPending = isProcessing === order.id;

            return (
              <div
                key={order.id}
                className="card bg-base-100 border border-base-300 shadow-sm rounded-2xl overflow-hidden"
              >
                <div className="card-body p-4 sm:p-5 flex flex-col gap-3">
                  {/* Top Bar: Order ID, Time & Status */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-black text-sm">
                        #{order.id.slice(0, 8)}
                      </span>
                      <div className="text-[11px] text-base-content/50 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {new Date(order.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-black text-base text-primary">
                        ₦{Number(order.total_amount).toLocaleString()}
                      </div>
                      <span
                        className={`badge badge-xs font-bold uppercase text-[9px] mt-0.5 ${
                          order.status === "payment_uploaded"
                            ? "badge-warning text-white font-black animate-pulse"
                            : order.status === "preparing"
                            ? "badge-primary"
                            : order.status === "delivered"
                            ? "badge-success text-white"
                            : order.status === "pending_acceptance"
                            ? "badge-accent text-black font-black"
                            : "badge-ghost"
                        }`}
                      >
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>

                  <div className="divider my-0"></div>

                  {/* Order Items */}
                  {order.order_items && order.order_items.length > 0 && (
                    <div className="flex flex-col gap-1 py-1">
                      {order.order_items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="font-semibold text-base-content">
                            {item.quantity}x {item.item_name}
                          </span>
                          <span className="text-base-content/70 font-mono">
                            ₦{Number(item.subtotal).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Customer Delivery Details */}
                  <div className="p-2.5 rounded-xl bg-base-200/60 text-xs flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 font-semibold text-base-content">
                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>
                        {order.delivery_city_area}, {order.delivery_city}
                      </span>
                    </div>
                    {order.delivery_landmark && (
                      <p className="text-[11px] text-primary pl-5">
                        Landmark: {order.delivery_landmark}
                      </p>
                    )}
                    <div className="flex items-center gap-1 text-[11px] text-base-content/60 pl-5">
                      <Phone className="w-3 h-3 text-base-content/40" />
                      <a
                        href={`tel:${order.contact_phone}`}
                        className="font-mono text-primary font-bold hover:underline"
                      >
                        {order.contact_phone}
                      </a>
                    </div>
                  </div>

                  {/* Transfer Receipt Notification for Vendor */}
                  {order.payment_receipt_url && (
                    <div className="p-3 rounded-xl bg-amber-100/90 border border-amber-300 dark:bg-amber-950/50 dark:border-amber-700 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-amber-700 dark:text-amber-300" />
                        <span className="text-xs font-black text-amber-950 dark:text-amber-100">
                          Customer Uploaded Transfer Receipt
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedReceipt(order.payment_receipt_url)}
                        className="btn btn-xs btn-warning text-white font-black gap-1 text-[11px] shadow-xs"
                      >
                        <Eye className="w-3 h-3" />
                        View Proof
                      </button>
                    </div>
                  )}

                  {/* Action Buttons Depending on Order State */}
                  {order.status === "pending_acceptance" && (
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <button
                        disabled={isPending}
                        onClick={() => setRejectingOrderId(order.id)}
                        className="btn btn-sm btn-ghost border border-base-300 font-bold text-xs"
                      >
                        <X className="w-4 h-4" /> Reject
                      </button>
                      <button
                        disabled={isPending}
                        onClick={() => handleAccept(order.id)}
                        className="btn btn-sm btn-primary font-bold text-xs shadow-sm shadow-primary/20"
                      >
                        <Check className="w-4 h-4" /> Accept Order
                      </button>
                    </div>
                  )}

                  {order.status === "awaiting_payment" && (
                    <div className="p-2 rounded-lg bg-base-200 text-center text-xs text-base-content/60">
                      Waiting for customer to complete bank transfer and upload receipt...
                    </div>
                  )}

                  {order.status === "payment_uploaded" && (
                    <button
                      disabled={isPending}
                      onClick={() => handleConfirmPayment(order.id)}
                      className="btn btn-sm btn-primary w-full font-bold text-xs shadow-md shadow-primary/20"
                    >
                      <Check className="w-4 h-4" /> Confirm Bank Transfer & Start Cooking
                    </button>
                  )}

                  {order.status === "preparing" && (
                    <button
                      disabled={isPending}
                      onClick={() => handleFulfillment(order.id, "out_for_delivery")}
                      className="btn btn-sm btn-secondary w-full font-bold text-xs shadow-md shadow-secondary/20"
                    >
                      <Truck className="w-4 h-4" /> Ready for Dispatch / Handed to Rider
                    </button>
                  )}

                  {order.status === "out_for_delivery" && (
                    <button
                      disabled={isPending}
                      onClick={() => handleFulfillment(order.id, "delivered")}
                      className="btn btn-sm btn-success text-white w-full font-bold text-xs shadow-md"
                    >
                      <Check className="w-4 h-4" /> Mark Order Delivered
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-16 text-center bg-base-100 rounded-2xl border border-base-300 col-span-1 lg:col-span-2">
            <ShoppingBag className="w-12 h-12 text-base-content/20 mx-auto mb-2" />
            <h3 className="font-bold text-base text-base-content">
              {searchQuery ? "No matching orders found" : "No orders yet"}
            </h3>
            <p className="text-xs text-base-content/50 max-w-xs mx-auto mt-1">
              {searchQuery
                ? `No orders match "${searchQuery}". Try searching by order ID, dish name, or phone number.`
                : "New customer orders will ring here in real-time. Keep your kitchen status turned on!"}
            </p>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                className="btn btn-ghost btn-xs border border-base-200 rounded-xl mt-3 text-xs"
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <p className="text-xs text-base-content/60">
            Showing{" "}
            <span className="font-semibold text-base-content">
              {(currentPage - 1) * ORDERS_PER_PAGE + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-base-content">
              {Math.min(currentPage * ORDERS_PER_PAGE, filteredOrders.length)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-base-content">
              {filteredOrders.length}
            </span>{" "}
            orders
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="btn btn-sm btn-outline border-base-300 rounded-xl gap-1 text-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <span className="text-xs font-semibold px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="btn btn-sm btn-outline border-base-300 rounded-xl gap-1 text-xs"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Receipt Viewer Modal */}
      {selectedReceipt && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md p-4">
            <h3 className="font-bold text-sm mb-3">Customer Transfer Receipt</h3>
            <div className="rounded-xl overflow-hidden border border-base-300 bg-black flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedReceipt}
                alt="Bank Transfer Receipt"
                className="max-h-96 w-full object-contain"
              />
            </div>
            <div className="modal-action mt-4">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="btn btn-sm btn-primary w-full"
              >
                Close Receipt
              </button>
            </div>
          </div>
          <div
            className="modal-backdrop bg-black/50"
            onClick={() => setSelectedReceipt(null)}
          ></div>
        </div>
      )}

      {/* Reject Order Modal */}
      {rejectingOrderId && (
        <div className="modal modal-open">
          <div className="modal-box max-w-sm p-5">
            <h3 className="font-bold text-base mb-2 flex items-center gap-1.5 text-error">
              <AlertCircle className="w-5 h-5" /> Reject Order
            </h3>
            <p className="text-xs text-base-content/60 mb-3">
              Please state why you cannot fulfill this order (e.g. food sold out).
            </p>
            <input
              type="text"
              placeholder="e.g. Egusi soup sold out for the day"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="input input-bordered input-sm w-full text-xs"
            />
            <div className="modal-action mt-4 flex justify-end gap-2">
              <button
                onClick={() => setRejectingOrderId(null)}
                className="btn btn-ghost btn-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="btn btn-error btn-sm text-white font-bold"
              >
                Confirm Reject
              </button>
            </div>
          </div>
          <div
            className="modal-backdrop bg-black/50"
            onClick={() => setRejectingOrderId(null)}
          ></div>
        </div>
      )}

      {/* In-app Alert Modal */}
      <ConfirmModal
        isOpen={!!alertInfo}
        title={alertInfo?.title || "Notice"}
        message={alertInfo?.message || ""}
        confirmText="Dismiss"
        showCancel={false}
        type="warning"
        onConfirm={() => setAlertInfo(null)}
      />
    </div>
  );
}
