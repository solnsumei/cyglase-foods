"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  UploadCloud,
  FileText,
  UtensilsCrossed,
  Truck,
  Building,
  Store,
  Phone,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import type { Database, OrderStatus } from "@/types/database.types";
import { uploadOrderReceipt } from "../../customer/actions";

type Order = Database["public"]["Tables"]["orders"]["Row"] & {
  vendors?: Database["public"]["Tables"]["vendors"]["Row"] | null;
  order_items?: Database["public"]["Tables"]["order_items"]["Row"][];
};

export default function OrderDetailClient({
  initialOrder,
}: {
  initialOrder: Order;
}) {
  const [order, setOrder] = useState<Order>(initialOrder);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Countdown timer state for awaiting_payment
  const [timeLeft, setTimeLeft] = useState<{
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({ minutes: 0, seconds: 0, isExpired: false });

  useEffect(() => {
    if (order.status !== "awaiting_payment" || !order.payment_deadline_at) {
      return;
    }

    const targetTime = new Date(order.payment_deadline_at).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = targetTime - now;

      if (difference <= 0) {
        setTimeLeft({ minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      setTimeLeft({ minutes, seconds, isExpired: false });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [order.status, order.payment_deadline_at]);

  const copyAccountNumber = (accNum: string) => {
    navigator.clipboard.writeText(accNum);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 3000);
  };

  const handleReceiptUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData(e.currentTarget);
    formData.append("order_id", order.id);

    try {
      const res = await uploadOrderReceipt(formData);
      if (res?.error) {
        setUploadError(res.error);
      } else if (res?.success) {
        setUploadSuccess(true);
        setOrder((prev) => ({
          ...prev,
          status: "payment_uploaded",
          payment_receipt_url: res.receiptUrl || prev.payment_receipt_url,
        }));
      }
    } catch (err: unknown) {
      setUploadError(
        err instanceof Error ? err.message : "Failed to upload receipt"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const vendor = order.vendors;

  return (
    <div className="min-h-screen bg-base-200/40 pb-20">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-base-100/90 backdrop-blur-md border-b border-base-200 px-4 py-3 sm:px-6">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="btn btn-ghost btn-xs sm:btn-sm gap-1 text-base-content/70 hover:text-primary rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-semibold text-xs">Food Market</span>
          </Link>

          <span className="font-mono text-xs font-bold text-base-content/60">
            Order #{order.id.slice(0, 8).toUpperCase()}
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-xl mx-auto p-4 sm:p-6 space-y-4">
        {/* Status Card */}
        <div className="card bg-base-100 shadow-sm border border-base-200 rounded-3xl p-5 text-center">
          {order.status === "pending_acceptance" && (
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-full bg-warning/15 text-warning flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <h2 className="text-lg font-black text-base-content">
                Order Received by Kitchen
              </h2>
              <p className="text-xs text-base-content/65 max-w-sm mx-auto">
                {vendor?.business_name} is reviewing your order items. Once
                accepted, you will receive payment details to make a bank transfer.
              </p>
            </div>
          )}

          {order.status === "awaiting_payment" && (
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-secondary/15 text-secondary flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6 animate-spin" />
              </div>
              <div>
                <h2 className="text-lg font-black text-base-content">
                  Order Accepted! Transfer Required
                </h2>
                <p className="text-xs text-base-content/65">
                  Please make a transfer to the vendor&apos;s account below before
                  the timer expires.
                </p>
              </div>

              {/* Countdown Timer */}
              <div className="p-3 bg-secondary/10 border border-secondary/20 rounded-2xl max-w-xs mx-auto">
                <div className="text-[11px] font-bold text-secondary uppercase tracking-wider">
                  Payment Countdown Window
                </div>
                <div className="text-2xl font-black font-mono text-secondary mt-0.5">
                  {timeLeft.isExpired ? (
                    <span className="text-error">EXPIRED</span>
                  ) : (
                    `${String(timeLeft.minutes).padStart(2, "0")}:${String(
                      timeLeft.seconds
                    ).padStart(2, "0")}`
                  )}
                </div>
              </div>
            </div>
          )}

          {order.status === "payment_uploaded" && (
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-full bg-primary/15 text-primary flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-black text-base-content">
                Receipt Uploaded! Verifying Credit
              </h2>
              <p className="text-xs text-base-content/65 max-w-sm mx-auto">
                Your payment receipt was sent to {vendor?.business_name}. The chef
                will confirm bank alert and begin cooking immediately.
              </p>
            </div>
          )}

          {order.status === "preparing" && (
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-full bg-success/15 text-success flex items-center justify-center mx-auto">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-black text-base-content">
                Payment Confirmed! Cooking in Progress
              </h2>
              <p className="text-xs text-base-content/65 max-w-sm mx-auto">
                Your delicious food is being prepared and freshly packaged for
                dispatch.
              </p>
            </div>
          )}

          {order.status === "out_for_delivery" && (
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-full bg-primary/15 text-primary flex items-center justify-center mx-auto">
                <Truck className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-black text-base-content">
                Order Out for Delivery! 🛵
              </h2>
              <p className="text-xs text-base-content/65 max-w-sm mx-auto">
                The dispatch rider is on the way to your address:{" "}
                <strong>{order.delivery_address}</strong>
              </p>
            </div>
          )}

          {order.status === "delivered" && (
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-full bg-success/20 text-success flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-black text-base-content">
                Delivered! Enjoy Your Meal 🍲
              </h2>
              <p className="text-xs text-base-content/65">
                Thank you for ordering with Cyglase Foods!
              </p>
            </div>
          )}

          {order.status === "cancelled" && (
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-full bg-error/15 text-error flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-black text-base-content">
                Order Cancelled
              </h2>
              <p className="text-xs text-base-content/65">
                This order was cancelled because payment was not uploaded within
                the allocated time duration.
              </p>
            </div>
          )}

          {order.status === "rejected" && (
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-full bg-error/15 text-error flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-black text-base-content">
                Order Declined by Kitchen
              </h2>
              <p className="text-xs text-base-content/65">
                Reason: {order.rejection_reason || "Vendor unable to prepare order"}
              </p>
            </div>
          )}
        </div>

        {/* Bank Transfer Details & Receipt Upload Box (Shown when awaiting_payment) */}
        {order.status === "awaiting_payment" && (
          <div className="card bg-base-100 shadow-md border-2 border-primary/30 rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-base-200">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-primary" />
                <h3 className="font-black text-sm text-base-content">
                  Vendor Bank Account
                </h3>
              </div>
              <span className="badge badge-primary text-white text-xs font-bold py-2">
                Pay ₦{Number(order.total_amount).toLocaleString()}
              </span>
            </div>

            <div className="space-y-2.5 bg-base-200/50 p-4 rounded-2xl text-xs">
              <div className="flex justify-between items-center">
                <span className="text-base-content/60">Bank Name</span>
                <span className="font-black text-base-content">
                  {vendor?.bank_name || "Bank Transfer"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-base-content/60">Account Number</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-black text-sm text-primary">
                    {vendor?.account_number || "Contact Vendor"}
                  </span>
                  {vendor?.account_number && (
                    <button
                      onClick={() => copyAccountNumber(vendor.account_number!)}
                      className="btn btn-ghost btn-xs btn-square text-base-content/70 hover:text-primary"
                      title="Copy Account Number"
                    >
                      {copiedAccount ? (
                        <Check className="w-3.5 h-3.5 text-success" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-base-content/60">Account Name</span>
                <span className="font-bold text-base-content">
                  {vendor?.account_name || vendor?.business_name}
                </span>
              </div>
            </div>

            {/* Receipt Upload Form */}
            <form onSubmit={handleReceiptUpload} className="space-y-3 pt-2">
              <h4 className="font-bold text-xs text-base-content flex items-center gap-1.5">
                <UploadCloud className="w-4 h-4 text-primary" />
                Upload Bank Transfer Receipt *
              </h4>

              {uploadError && (
                <div className="alert alert-error text-xs py-2 rounded-xl text-white">
                  <span>{uploadError}</span>
                </div>
              )}

              <input
                type="file"
                name="receipt"
                required
                accept="image/*,application/pdf"
                className="file-input file-input-bordered file-input-sm w-full rounded-xl text-xs"
              />

              <button
                type="submit"
                disabled={isUploading || timeLeft.isExpired}
                className="btn btn-primary w-full rounded-xl font-black text-white text-xs shadow-md shadow-primary/20"
              >
                {isUploading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Uploading Receipt...
                  </span>
                ) : (
                  "Confirm Transfer & Submit Receipt"
                )}
              </button>
            </form>
          </div>
        )}

        {/* Order Items & Summary Card */}
        <div className="card bg-base-100 shadow-sm border border-base-200 rounded-3xl p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-base-200 text-xs font-black uppercase text-base-content/70">
            <span>Ordered Items</span>
            <span>Qty</span>
          </div>

          <div className="space-y-2 text-xs">
            {order.order_items?.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-base-content"
              >
                <div className="flex-1 min-w-0 pr-3">
                  <div className="font-bold truncate">{item.item_name}</div>
                  <div className="text-[11px] text-base-content/60">
                    ₦{Number(item.unit_price).toLocaleString()} each
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono font-bold">× {item.quantity}</span>
                  <div className="font-black text-primary">
                    ₦{Number(item.subtotal).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-base-200 space-y-1 text-xs">
            <div className="flex justify-between text-base-content/70">
              <span>Subtotal</span>
              <span className="font-bold">
                ₦{Number(order.subtotal).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-base-content/70">
              <span>Delivery Fee</span>
              <span className="font-bold">
                ₦{Number(order.delivery_fee).toLocaleString()}
              </span>
            </div>
            <div className="pt-2 border-t border-base-200 flex justify-between text-sm font-black text-base-content">
              <span>Total Amount</span>
              <span className="text-primary text-base">
                ₦{Number(order.total_amount).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Delivery Details Card */}
        <div className="card bg-base-100 shadow-sm border border-base-200 rounded-3xl p-5 space-y-2 text-xs">
          <h3 className="font-black text-xs uppercase tracking-wider text-base-content/70 pb-1 border-b border-base-200">
            Delivery Destination
          </h3>
          <div className="flex justify-between">
            <span className="text-base-content/60">Phone Contact</span>
            <span className="font-mono font-bold">{order.contact_phone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-base-content/60">Delivery Area</span>
            <span className="font-bold">{order.delivery_city_area}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-base-content/60">Address</span>
            <span className="font-medium text-right max-w-[200px]">
              {order.delivery_address}
            </span>
          </div>
          {order.delivery_landmark && (
            <div className="flex justify-between">
              <span className="text-base-content/60">Landmark</span>
              <span className="font-medium text-right">{order.delivery_landmark}</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
