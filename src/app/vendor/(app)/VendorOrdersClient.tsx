"use client";

import { useState } from "react";
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

  // Tabs: Active vs Completed
  const [filter, setFilter] = useState<"action_required" | "in_kitchen" | "all">(
    "action_required"
  );

  const actionRequiredOrders = orders.filter(
    (o) =>
      o.status === "pending_acceptance" ||
      o.status === "awaiting_payment" ||
      o.status === "payment_uploaded"
  );

  const inKitchenOrders = orders.filter(
    (o) => o.status === "preparing" || o.status === "out_for_delivery"
  );

  const displayedOrders =
    filter === "action_required"
      ? actionRequiredOrders
      : filter === "in_kitchen"
      ? inKitchenOrders
      : orders;

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

  return (
    <div className="flex flex-col gap-4">
      {/* Mobile-friendly Filter Pills */}
      <div className="flex gap-2 p-1 bg-base-100 rounded-xl border border-base-300 shadow-xs">
        <button
          onClick={() => setFilter("action_required")}
          className={`btn btn-xs flex-1 rounded-lg font-bold ${
            filter === "action_required" ? "btn-primary text-white" : "btn-ghost"
          }`}
        >
          Action Needed ({actionRequiredOrders.length})
        </button>
        <button
          onClick={() => setFilter("in_kitchen")}
          className={`btn btn-xs flex-1 rounded-lg font-bold ${
            filter === "in_kitchen" ? "btn-primary text-white" : "btn-ghost"
          }`}
        >
          Cooking ({inKitchenOrders.length})
        </button>
        <button
          onClick={() => setFilter("all")}
          className={`btn btn-xs flex-1 rounded-lg font-bold ${
            filter === "all" ? "btn-primary text-white" : "btn-ghost"
          }`}
        >
          All ({orders.length})
        </button>
      </div>

      {/* Orders Feed */}
      <div className="flex flex-col gap-3">
        {displayedOrders.length > 0 ? (
          displayedOrders.map((order) => {
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
                            ? "badge-warning animate-pulse"
                            : order.status === "preparing"
                            ? "badge-primary"
                            : order.status === "delivered"
                            ? "badge-success text-white"
                            : order.status === "pending_acceptance"
                            ? "badge-accent"
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
                    <div className="p-3 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-accent" />
                        <span className="text-xs font-bold text-accent-content">
                          Customer Uploaded Transfer Receipt
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedReceipt(order.payment_receipt_url)}
                        className="btn btn-xs btn-accent font-bold gap-1 text-[11px]"
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
          <div className="py-16 text-center bg-base-100 rounded-2xl border border-base-300">
            <ShoppingBag className="w-12 h-12 text-base-content/20 mx-auto mb-2" />
            <h3 className="font-bold text-base text-base-content">
              No orders in this tab
            </h3>
            <p className="text-xs text-base-content/50 max-w-xs mx-auto mt-1">
              New customer orders will ring here in real-time. Keep your kitchen status turned on!
            </p>
          </div>
        )}
      </div>

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
