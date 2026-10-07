"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Store,
  MapPin,
  Clock,
  Phone,
  UtensilsCrossed,
  Plus,
  Minus,
  ShoppingBag,
  X,
  CreditCard,
  AlertCircle,
  Loader2,
  Check,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import type { Database } from "@/types/database.types";
import { placeCustomerOrder, CartItem } from "../../customer/actions";

type Vendor = Database["public"]["Tables"]["vendors"]["Row"];
type MenuItem = Database["public"]["Tables"]["menu_items"]["Row"] & {
  categories?: { name: string; slug: string } | null;
};
type Category = Database["public"]["Tables"]["categories"]["Row"];

interface Props {
  vendor: Vendor;
  menuItems: MenuItem[];
  categories: Category[];
  currentUser: any;
}

const DEFAULT_DELIVERY_FEE = 1200; // Flat local delivery fee in Naira

export default function StorefrontClient({
  vendor,
  menuItems,
  categories,
  currentUser,
}: Props) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Customer form fields
  const [customerName, setCustomerName] = useState(
    currentUser?.user_metadata?.full_name || ""
  );
  const [customerPhone, setCustomerPhone] = useState(
    currentUser?.user_metadata?.phone || ""
  );
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryLandmark, setDeliveryLandmark] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");

  // Cart operations
  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          id: item.id,
          name: item.name,
          price: Number(item.price),
          quantity: 1,
        },
      ];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map((i) =>
          i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
        );
      }
      return prev.filter((i) => i.id !== itemId);
    });
  };

  const cartTotalItems = cart.reduce((acc, curr) => acc + curr.quantity, 0);
  const subtotal = cart.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
  const totalAmount = subtotal + (cart.length > 0 ? DEFAULT_DELIVERY_FEE : 0);

  // Filtered menu
  const filteredItems = menuItems.filter((item) => {
    return selectedCategory === "all" || item.category_id === selectedCategory;
  });

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setIsCheckingOut(true);
    setErrorMsg(null);

    const res = await placeCustomerOrder({
      vendorId: vendor.id,
      customerName,
      customerPhone,
      customerEmail: currentUser?.email,
      deliveryAddress,
      deliveryLandmark,
      deliveryNotes,
      items: cart,
      subtotal,
      deliveryFee: DEFAULT_DELIVERY_FEE,
      totalAmount,
    });

    setIsCheckingOut(false);

    if (res?.error) {
      setErrorMsg(res.error);
    } else if (res?.orderId) {
      // Clear cart and redirect to order tracking page
      setCart([]);
      setIsCartOpen(false);
      router.push(`/orders/${res.orderId}`);
    }
  };

  return (
    <div className="min-h-screen bg-base-200/40 pb-24">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-base-100/90 backdrop-blur-md border-b border-base-200 px-4 py-3 sm:px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="btn btn-ghost btn-xs sm:btn-sm gap-1 text-base-content/70 hover:text-primary rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-semibold text-xs">Back</span>
          </Link>

          <span className="font-black text-sm text-base-content truncate max-w-[200px]">
            {vendor.business_name}
          </span>

          <button
            onClick={() => setIsCartOpen(true)}
            className="btn btn-primary btn-xs sm:btn-sm gap-1.5 rounded-xl text-white font-bold relative"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>₦{subtotal.toLocaleString()}</span>
            {cartTotalItems > 0 && (
              <span className="badge badge-secondary badge-xs absolute -top-1.5 -right-1.5 font-bold">
                {cartTotalItems}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto p-4 sm:p-6 space-y-4">
        {/* Vendor Header Card */}
        <div className="card bg-base-100 shadow-sm border border-base-200 rounded-3xl p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="badge badge-sm badge-ghost text-xs font-semibold bg-base-200">
                  {vendor.city_area || "Lagos"}
                </span>
                {vendor.is_open ? (
                  <span className="badge badge-sm badge-success/15 text-success font-bold border-none text-[11px] gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                    Open for Orders
                  </span>
                ) : (
                  <span className="badge badge-sm badge-error/15 text-error font-bold border-none text-[11px] gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                    Kitchen Closed
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-base-content tracking-tight">
                {vendor.business_name}
              </h1>

              <p className="text-xs text-base-content/65 flex items-center gap-1.5 mt-1">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>{vendor.address || `${vendor.city_area}, ${vendor.city}`}</span>
              </p>

              <div className="flex items-center gap-4 text-xs text-base-content/60 mt-2">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {vendor.opening_time.slice(0, 5)} - {vendor.closing_time.slice(0, 5)}
                  </span>
                </div>
                {vendor.is_phone_public && (
                  <div className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-primary" />
                    <span className="font-mono">{vendor.phone}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 font-black">
              <Store className="w-7 h-7" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-base-200 flex items-center justify-between text-[11px] text-base-content/70">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-success" />
              Direct Bank Transfer Settlement
            </span>
            <span>Delivery: ₦{DEFAULT_DELIVERY_FEE.toLocaleString()}</span>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`btn btn-xs sm:btn-sm rounded-full whitespace-nowrap px-3.5 font-bold transition-all ${
              selectedCategory === "all"
                ? "btn-primary text-white shadow-sm"
                : "btn-ghost bg-base-100 hover:bg-base-200 border border-base-200 text-base-content/70"
            }`}
          >
            All Dishes ({menuItems.length})
          </button>
          {categories.map((cat) => {
            const count = menuItems.filter((i) => i.category_id === cat.id).length;
            if (count === 0) return null;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`btn btn-xs sm:btn-sm rounded-full whitespace-nowrap px-3.5 font-semibold transition-all ${
                  selectedCategory === cat.id
                    ? "btn-primary text-white shadow-sm"
                    : "btn-ghost bg-base-100 hover:bg-base-200 border border-base-200 text-base-content/70"
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Menu Items List */}
        {filteredItems.length === 0 ? (
          <div className="card bg-base-100 border border-base-200 p-8 text-center rounded-3xl">
            <UtensilsCrossed className="w-8 h-8 text-base-content/40 mx-auto mb-2" />
            <h3 className="font-bold text-sm text-base-content">
              No dishes available in this section
            </h3>
            <p className="text-xs text-base-content/60 mt-1">
              Please check back shortly or choose another category.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => {
              const inCartItem = cart.find((i) => i.id === item.id);

              return (
                <div
                  key={item.id}
                  className="card bg-base-100 shadow-sm border border-base-200 rounded-2xl p-4 flex flex-row items-center justify-between gap-3 hover:border-primary/30 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <span className="badge badge-xs badge-ghost text-[10px] font-medium bg-base-200 mb-1">
                      {item.categories?.name || "Dish"}
                    </span>
                    <h3 className="font-bold text-base text-base-content truncate">
                      {item.name}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-base-content/65 line-clamp-2 mt-0.5 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                    <div className="mt-2 text-base font-black text-primary">
                      ₦{Number(item.price).toLocaleString()}
                    </div>
                  </div>

                  {/* Quantity / Add to Cart Action */}
                  <div className="shrink-0 flex items-center">
                    {inCartItem ? (
                      <div className="flex items-center gap-1.5 bg-primary/10 rounded-xl p-1 border border-primary/20">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="btn btn-ghost btn-xs btn-square text-primary hover:bg-primary/20 rounded-lg"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-black text-primary px-1.5">
                          {inCartItem.quantity}
                        </span>
                        <button
                          onClick={() => addToCart(item)}
                          className="btn btn-ghost btn-xs btn-square text-primary hover:bg-primary/20 rounded-lg"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(item)}
                        disabled={!vendor.is_open || !item.is_available}
                        className="btn btn-primary btn-sm rounded-xl font-bold text-white shadow-xs gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Bottom Cart Bar */}
      {cart.length > 0 && !isCartOpen && (
        <div className="fixed bottom-4 left-4 right-4 max-w-xl mx-auto z-40 animate-in slide-in-from-bottom duration-300">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-primary text-white rounded-2xl p-4 shadow-2xl flex items-center justify-between hover:bg-primary/95 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center font-black text-sm">
                {cartTotalItems}
              </div>
              <div className="text-left">
                <div className="text-xs font-medium text-white/80">View Cart</div>
                <div className="text-base font-black">
                  ₦{subtotal.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-sm font-bold">
              <span>Checkout</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* Checkout Drawer / Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-base-100 w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 sm:p-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-base-200 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-base-content">
                    Order from {vendor.business_name}
                  </h3>
                  <p className="text-[11px] text-base-content/60">
                    {cartTotalItems} dishes in cart
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="btn btn-ghost btn-sm btn-circle"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="alert alert-error text-xs py-2 mb-4 rounded-xl text-white">
                <AlertCircle className="w-4 h-4" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Cart Items List */}
            <div className="space-y-2 mb-4">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 bg-base-200/50 rounded-xl text-xs"
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="font-bold text-base-content truncate">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-base-content/60">
                      ₦{item.price.toLocaleString()} × {item.quantity}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="btn btn-ghost btn-xs btn-circle bg-base-100"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-black px-1.5">{item.quantity}</span>
                    <button
                      onClick={() =>
                        addToCart({
                          id: item.id,
                          name: item.name,
                          price: item.price,
                        } as any)
                      }
                      className="btn btn-ghost btn-xs btn-circle bg-base-100"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Price Breakdown */}
            <div className="p-3 bg-base-200/40 rounded-2xl space-y-1.5 text-xs mb-4">
              <div className="flex justify-between text-base-content/70">
                <span>Subtotal</span>
                <span className="font-bold">₦{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-base-content/70">
                <span>Delivery Fee</span>
                <span className="font-bold">
                  ₦{DEFAULT_DELIVERY_FEE.toLocaleString()}
                </span>
              </div>
              <div className="pt-2 border-t border-base-200 flex justify-between text-sm font-black text-base-content">
                <span>Total Amount</span>
                <span className="text-primary text-base">
                  ₦{totalAmount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Delivery Form */}
            <form onSubmit={handleCheckout} className="space-y-3">
              <h4 className="font-black text-xs text-base-content uppercase tracking-wider">
                Delivery Details
              </h4>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label text-[11px] font-bold py-0.5">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Amaka Okafor"
                    className="input input-bordered input-sm w-full rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="label text-[11px] font-bold py-0.5">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="0803 123 4567"
                    className="input input-bordered input-sm w-full rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="label text-[11px] font-bold py-0.5">
                  Delivery Address *
                </label>
                <input
                  type="text"
                  required
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="e.g. Flat 4, 12 Borno Way, Yaba"
                  className="input input-bordered input-sm w-full rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="label text-[11px] font-bold py-0.5">
                  Nearest Landmark (Optional)
                </label>
                <input
                  type="text"
                  value={deliveryLandmark}
                  onChange={(e) => setDeliveryLandmark(e.target.value)}
                  placeholder="e.g. Opposite Total Filling Station"
                  className="input input-bordered input-sm w-full rounded-xl text-xs"
                />
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-900 dark:text-amber-300">
                <span className="font-bold">ℹ️ Payment Method:</span> Manual Bank
                Transfer. Once the vendor accepts your order, you will receive the
                vendor&apos;s bank account to transfer and upload receipt within the
                timer.
              </div>

              <button
                type="submit"
                disabled={isCheckingOut}
                className="btn btn-primary w-full rounded-xl text-white font-black text-sm shadow-lg shadow-primary/30 py-3"
              >
                {isCheckingOut ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Placing Order...
                  </span>
                ) : (
                  <span>Place Order • ₦{totalAmount.toLocaleString()}</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
