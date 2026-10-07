"use client";

import { useState } from "react";
import { updateOrderStatus } from "../../actions";
import {
  ShoppingBag,
  MapPin,
  Phone,
  FileText,
  Clock,
  ExternalLink,
  ChevronRight,
  Eye,
} from "lucide-react";
import type { Database, OrderStatus } from "@/types/database.types";

type Order = Database["public"]["Tables"]["orders"]["Row"] & {
  vendors?: {
    business_name: string;
    phone: string;
  } | null;
  profiles?: {
    email: string;
    full_name: string | null;
  } | null;
  order_items?: Database["public"]["Tables"]["order_items"]["Row"][];
};

const STATUS_FILTERS: { label: string; value: OrderStatus | "all" }[] = [
  { label: "All Orders", value: "all" },
  { label: "Awaiting Vendor", value: "pending_acceptance" },
  { label: "Awaiting Transfer", value: "awaiting_payment" },
  { label: "Receipt Uploaded", value: "payment_uploaded" },
  { label: "Preparing", value: "preparing" },
  { label: "Out For Delivery", value: "out_for_delivery" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

export default function OrdersManager({
  initialOrders,
}: {
  initialOrders: Order[];
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [activeFilter, setActiveFilter] = useState<OrderStatus | "all">("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const filteredOrders = orders.filter((o) =>
    activeFilter === "all" ? true : o.status === activeFilter
  );

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setIsUpdating(true);
    const res = await updateOrderStatus(orderId, newStatus);
    setIsUpdating(false);

    if (res?.error) {
      alert(res.error);
    } else {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "pending_acceptance":
        return <span className="badge badge-warning text-[10px] font-bold">Awaiting Vendor</span>;
      case "awaiting_payment":
        return <span className="badge badge-info text-[10px] font-bold">Awaiting Payment</span>;
      case "payment_uploaded":
        return <span className="badge badge-accent text-[10px] font-bold animate-pulse">Receipt Uploaded</span>;
      case "preparing":
        return <span className="badge badge-primary text-[10px] font-bold">Kitchen Preparing</span>;
      case "out_for_delivery":
        return <span className="badge badge-secondary text-[10px] font-bold">Out for Delivery</span>;
      case "delivered":
        return <span className="badge badge-success text-[10px] font-bold text-white">Delivered</span>;
      case "rejected":
      case "cancelled":
        return <span className="badge badge-error text-[10px] font-bold text-white">{status}</span>;
      default:
        return <span className="badge badge-ghost text-[10px] font-bold">{status}</span>;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-primary" />
          Orders & Payment Verification
        </h1>
        <p className="text-xs text-base-content/60 mt-1">
          Monitor incoming customer orders, review bank transfer payment proofs, and oversee dispatch.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setActiveFilter(f.value)}
            className={`btn btn-xs rounded-full font-bold whitespace-nowrap ${
              activeFilter === f.value
                ? "btn-primary text-white"
                : "btn-ghost border border-base-300"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="card bg-base-100 border border-base-300 shadow-xs">
        <div className="card-body p-0">
          {filteredOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full text-xs">
                <thead className="bg-base-200/60 text-base-content/70">
                  <tr>
                    <th>Order & Time</th>
                    <th>Vendor</th>
                    <th>Destination</th>
                    <th>Amount (NGN)</th>
                    <th>Status</th>
                    <th>Receipt</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover">
                      <td>
                        <div className="font-mono font-bold text-sm">
                          #{order.id.slice(0, 8)}
                        </div>
                        <div className="text-[11px] text-base-content/50 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(order.created_at).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>

                      <td>
                        <span className="font-semibold text-xs text-base-content">
                          {order.vendors?.business_name || "Unknown"}
                        </span>
                      </td>

                      <td>
                        <div className="flex items-center gap-1 font-medium">
                          <MapPin className="w-3 h-3 text-primary shrink-0" />
                          <span>
                            {order.delivery_city_area}, {order.delivery_city}
                          </span>
                        </div>
                        <div className="text-[10px] text-base-content/50 flex items-center gap-1 font-mono">
                          <Phone className="w-2.5 h-2.5" />
                          {order.contact_phone}
                        </div>
                      </td>

                      <td>
                        <div className="font-black text-sm text-primary">
                          ₦{Number(order.total_amount).toLocaleString()}
                        </div>
                        <div className="text-[10px] text-base-content/50">
                          (Subtotal: ₦{Number(order.subtotal).toLocaleString()})
                        </div>
                      </td>

                      <td>{getStatusBadge(order.status as OrderStatus)}</td>

                      <td>
                        {order.payment_receipt_url ? (
                          <a
                            href={order.payment_receipt_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-xs btn-outline btn-accent gap-1 text-[11px]"
                          >
                            <Eye className="w-3 h-3" />
                            View
                          </a>
                        ) : (
                          <span className="text-[11px] text-base-content/40">
                            No receipt
                          </span>
                        )}
                      </td>

                      <td className="text-right">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="btn btn-ghost btn-xs text-primary font-bold gap-1"
                        >
                          Details <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center">
              <ShoppingBag className="w-12 h-12 text-base-content/30 mx-auto mb-3" />
              <h3 className="font-bold text-base text-base-content">
                No orders match this filter
              </h3>
              <p className="text-xs text-base-content/60 max-w-sm mx-auto mt-1">
                Select another status filter or wait for customer checkout activity.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="modal modal-open">
          <div className="modal-box max-w-xl border border-base-300">
            <div className="flex items-center justify-between border-b border-base-200 pb-3 mb-4">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  Order #{selectedOrder.id.slice(0, 8)}
                </h3>
                <span className="text-xs text-base-content/50">
                  {new Date(selectedOrder.created_at).toLocaleString()}
                </span>
              </div>
              <div>{getStatusBadge(selectedOrder.status as OrderStatus)}</div>
            </div>

            <div className="flex flex-col gap-4 text-xs">
              {/* Financial summary */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-base-200/60 rounded-xl border border-base-300/40 text-center">
                <div>
                  <span className="text-[10px] text-base-content/50 font-semibold uppercase">
                    Subtotal
                  </span>
                  <p className="font-bold text-sm">
                    ₦{Number(selectedOrder.subtotal).toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-base-content/50 font-semibold uppercase">
                    Delivery Fee
                  </span>
                  <p className="font-bold text-sm">
                    ₦{Number(selectedOrder.delivery_fee).toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-base-content/50 font-semibold uppercase">
                    Total Amount
                  </span>
                  <p className="font-black text-sm text-primary">
                    ₦{Number(selectedOrder.total_amount).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Delivery info */}
              <div className="p-3 bg-base-200/60 rounded-xl border border-base-300/40">
                <span className="text-[10px] text-base-content/50 font-semibold uppercase tracking-wider">
                  Delivery Destination
                </span>
                <p className="font-semibold text-sm mt-1">
                  {selectedOrder.delivery_address}
                </p>
                <p className="text-base-content/70 mt-0.5">
                  {selectedOrder.delivery_city_area}, {selectedOrder.delivery_city},{" "}
                  {selectedOrder.delivery_state}
                </p>
                {selectedOrder.delivery_landmark && (
                  <p className="text-primary font-medium mt-1">
                    Landmark: {selectedOrder.delivery_landmark}
                  </p>
                )}
                <div className="mt-2 text-xs font-mono flex items-center gap-1 font-bold">
                  <Phone className="w-3.5 h-3.5 text-primary" />
                  Customer Phone: {selectedOrder.contact_phone}
                </div>
              </div>

              {/* Transfer Receipt Proof */}
              {selectedOrder.payment_receipt_url && (
                <div className="p-3 bg-base-200/60 rounded-xl border border-base-300/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-base-content/50 font-semibold uppercase tracking-wider flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-primary" />
                      Uploaded Bank Transfer Receipt
                    </span>
                    <a
                      href={selectedOrder.payment_receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                    >
                      Open Full Size <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="rounded-lg overflow-hidden border border-base-300 max-h-48 bg-base-100 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedOrder.payment_receipt_url}
                      alt="Payment Receipt"
                      className="object-contain max-h-48 w-full"
                    />
                  </div>
                </div>
              )}

              {/* Status Update Actions */}
              <div className="p-3 bg-base-200/60 rounded-xl border border-base-300/40">
                <span className="text-[10px] text-base-content/50 font-semibold uppercase tracking-wider mb-2 block">
                  Admin Status Override
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    disabled={isUpdating}
                    onClick={() => handleStatusChange(selectedOrder.id, "preparing")}
                    className="btn btn-xs btn-primary font-bold"
                  >
                    Confirm Payment & Prepare
                  </button>
                  <button
                    disabled={isUpdating}
                    onClick={() => handleStatusChange(selectedOrder.id, "out_for_delivery")}
                    className="btn btn-xs btn-secondary font-bold"
                  >
                    Mark Out For Delivery
                  </button>
                  <button
                    disabled={isUpdating}
                    onClick={() => handleStatusChange(selectedOrder.id, "delivered")}
                    className="btn btn-xs btn-success text-white font-bold"
                  >
                    Mark Delivered
                  </button>
                  <button
                    disabled={isUpdating}
                    onClick={() => handleStatusChange(selectedOrder.id, "cancelled")}
                    className="btn btn-xs btn-error text-white font-bold"
                  >
                    Cancel Order
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-action mt-6">
              <button
                onClick={() => setSelectedOrder(null)}
                className="btn btn-ghost btn-sm"
              >
                Close
              </button>
            </div>
          </div>
          <div
            className="modal-backdrop bg-black/40"
            onClick={() => setSelectedOrder(null)}
          ></div>
        </div>
      )}
    </div>
  );
}
