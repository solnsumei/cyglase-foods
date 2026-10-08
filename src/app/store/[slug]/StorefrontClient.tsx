"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Store,
  MapPin,
  Clock,
  UtensilsCrossed,
  Plus,
  Minus,
  ShoppingBag,
  X,
  CreditCard,
  AlertCircle,
  Loader2,
  Check,
  ChevronRight,
  Truck,
  PackageCheck,
  Mail,
  User,
  Phone,
} from "lucide-react";
import type { Database } from "@/types/database.types";
import { placeCustomerOrder, CartItem } from "../../customer/actions";
import { getVendorLiveStatus } from "@/lib/vendorStatus";

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
  const vendorStatus = getVendorLiveStatus(vendor);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fulfillment Method: Delivery vs Pickup
  const [fulfillmentType, setFulfillmentType] = useState<"delivery" | "pickup">("delivery");

  // Customer form fields
  const [customerName, setCustomerName] = useState(
    currentUser?.user_metadata?.full_name || ""
  );
  const [customerEmail, setCustomerEmail] = useState(
    currentUser?.email || ""
  );
  const [customerPhone, setCustomerPhone] = useState(
    currentUser?.user_metadata?.phone || ""
  );
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryLandmark, setDeliveryLandmark] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");

  // Cart operations
  const addToCart = (item: MenuItem) => {
    if (!vendorStatus.isAcceptingOrders) return;
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
  const deliveryFee = fulfillmentType === "pickup" ? 0 : DEFAULT_DELIVERY_FEE;
  const totalAmount = subtotal + deliveryFee;

  // Filtered menu
  const filteredItems = menuItems.filter((item) => {
    return selectedCategory === "all" || item.category_id === selectedCategory;
  });

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!vendorStatus.isAcceptingOrders) {
      setErrorMsg(
        vendorStatus.status === "closed_hours"
          ? `This kitchen is currently outside operating hours (${vendorStatus.subtext}).`
          : "This kitchen is temporarily paused and not accepting new orders right now."
      );
      return;
    }
    setIsCheckingOut(true);
    setErrorMsg(null);

    const res = await placeCustomerOrder({
      vendorId: vendor.id,
      customerName,
      customerPhone,
      customerEmail,
      fulfillmentType,
      deliveryAddress,
      deliveryLandmark,
      deliveryNotes,
      items: cart,
      subtotal,
      deliveryFee,
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

  // Fallback banner image if vendor hasn't uploaded one
  const bannerImage =
    vendor.banner_url || "/images/cuisines/jollof_party_dish.jpg";

  return (
    <div className="min-h-screen bg-base-200/40 pb-24">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-base-100/90 backdrop-blur-md border-b border-base-200 px-4 py-3 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="btn btn-ghost btn-xs sm:btn-sm gap-1 text-base-content/70 hover:text-primary rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-semibold text-xs">Back</span>
          </Link>

          <span className="font-black text-sm sm:text-base text-base-content truncate max-w-[200px] sm:max-w-md">
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

      {/* Main Container: Expanded to max-w-6xl matching other pages */}
      <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-5">
        {/* Vendor Header Card with Cover Banner & Logo */}
        <div className="card bg-base-100 shadow-sm border border-base-200 rounded-3xl overflow-hidden">
          {/* Store Banner Image */}
          <div className="relative h-44 sm:h-56 md:h-64 lg:h-72 w-full bg-base-300">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={bannerImage}
              alt={vendor.business_name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
          </div>

          <div className="p-5 sm:p-6 relative pt-0">
            {/* Overlapping Vendor Logo Avatar */}
            <div className="-mt-10 sm:-mt-12 mb-3 flex items-end justify-between">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-base-100 p-1.5 shadow-xl border border-base-200">
                {vendor.logo_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={vendor.logo_url}
                    alt={vendor.business_name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <div className="w-full h-full rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black">
                    <Store className="w-8 h-8 sm:w-10 sm:h-10" />
                  </div>
                )}
              </div>

              {vendorStatus.status === "accepting" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-950 border border-emerald-300 shadow-xs dark:bg-emerald-950/80 dark:text-emerald-100 dark:border-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  Open for Orders
                </span>
              ) : vendorStatus.status === "paused" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-amber-100 text-amber-950 border border-amber-300 shadow-xs dark:bg-amber-950/80 dark:text-amber-100 dark:border-amber-800">
                  <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                  Orders Paused
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-red-100 text-red-950 border border-red-300 shadow-xs dark:bg-red-950/80 dark:text-red-100 dark:border-red-800">
                  <span className="w-2 h-2 rounded-full bg-red-600"></span>
                  {vendorStatus.badgeText}
                </span>
              )}
            </div>

            {/* Store Information (Phone Number & Settlement Hidden as requested) */}
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="badge badge-sm badge-ghost text-xs font-bold bg-base-200">
                  {vendor.city_area || "Lagos"}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-base-content tracking-tight">
                {vendor.business_name}
              </h1>

              {vendor.description && (
                <p className="text-xs text-base-content/70 mt-1 line-clamp-2">
                  {vendor.description}
                </p>
              )}

              <p className="text-xs text-base-content/65 flex items-center gap-1.5 mt-2">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>{vendor.address || `${vendor.city_area}, ${vendor.city}`}</span>
              </p>

              <div className="flex items-center gap-3 text-xs text-base-content/60 mt-1.5">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {vendor.opening_time.slice(0, 5)} - {vendor.closing_time.slice(0, 5)}
                  </span>
                </div>
              </div>

              {!vendorStatus.isAcceptingOrders && (
                <div className="mt-4 p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 dark:bg-amber-950/40 dark:border-amber-700/60 flex items-start sm:items-center gap-3 shadow-xs">
                  <div className="w-8 h-8 rounded-xl bg-amber-200/80 dark:bg-amber-900/60 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-amber-950 dark:text-amber-100" />
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-amber-950 dark:text-amber-100 leading-snug">
                    {vendorStatus.status === "closed_hours"
                      ? `This kitchen is currently outside operating hours (${vendorStatus.subtext}). Menu is available for browsing only.`
                      : "This kitchen is temporarily paused and not accepting new orders right now."}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.map((item) => {
              const inCartItem = cart.find((i) => i.id === item.id);

              return (
                <div
                  key={item.id}
                  className="card bg-base-100 shadow-sm border border-base-200 rounded-2xl p-4 flex flex-row items-center justify-between gap-3 hover:border-primary/30 transition-all"
                >
                  {item.image_url && (
                    <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-2xl overflow-hidden shrink-0 bg-base-200 border border-base-200/80">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className="badge badge-xs badge-ghost text-[10px] font-medium bg-base-200">
                        {item.categories?.name || "Dish"}
                      </span>
                      {item.preparation_time_minutes ? (
                        <span className="badge badge-xs badge-ghost text-[10px] font-medium bg-base-200 text-base-content/70 gap-1">
                          <Clock className="w-2.5 h-2.5 text-primary" />
                          ~{item.preparation_time_minutes} mins
                        </span>
                      ) : null}
                    </div>

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
                        disabled={!vendorStatus.isAcceptingOrders || !item.is_available}
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

      {/* Floating Bottom Cart Trigger */}
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

      {/* Mobile-Friendly Cart Slide-over / Full Screen Sheet (Not a popup modal on mobile) */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex sm:items-center sm:justify-center animate-in fade-in duration-200">
          <div className="bg-base-100 w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-lg sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-base-200 bg-base-100 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="btn btn-ghost btn-circle btn-sm sm:hidden"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-base-content">
                    Order from {vendor.business_name}
                  </h3>
                  <p className="text-[11px] text-base-content/60">
                    {cartTotalItems} items in your tray
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="btn btn-ghost btn-sm btn-circle hidden sm:flex"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {!vendorStatus.isAcceptingOrders && (
                <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 dark:bg-amber-950/40 dark:border-amber-700/60 flex items-start gap-3 shadow-xs">
                  <div className="w-8 h-8 rounded-xl bg-amber-200/80 dark:bg-amber-900/60 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-amber-950 dark:text-amber-100" />
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-amber-950 dark:text-amber-100 leading-snug">
                    {vendorStatus.status === "closed_hours"
                      ? `This kitchen is outside operating hours (${vendorStatus.subtext}). Orders cannot be placed right now.`
                      : "This kitchen is temporarily paused and not accepting new orders right now."}
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="alert alert-error text-xs py-2 rounded-xl text-white">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Cart Items List */}
              <div className="space-y-2">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-base-200/50 rounded-2xl text-xs"
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

              {/* Fulfillment Method Selector: Delivery vs Pickup */}
              <div className="space-y-2">
                <label className="text-xs font-black text-base-content uppercase tracking-wider block">
                  How would you like to receive your food?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFulfillmentType("delivery")}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-1 ${
                      fulfillmentType === "delivery"
                        ? "border-primary bg-primary/5 text-primary font-bold shadow-xs"
                        : "border-base-200 bg-base-100 text-base-content/70 hover:border-base-300"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-black">
                      <Truck className="w-4 h-4" />
                      <span>Doorstep Delivery</span>
                    </div>
                    <span className="text-[11px] text-base-content/60">
                      Rider fee: ₦{DEFAULT_DELIVERY_FEE.toLocaleString()}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFulfillmentType("pickup")}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-1 ${
                      fulfillmentType === "pickup"
                        ? "border-primary bg-primary/5 text-primary font-bold shadow-xs"
                        : "border-base-200 bg-base-100 text-base-content/70 hover:border-base-300"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-black">
                      <PackageCheck className="w-4 h-4" />
                      <span>Self Pickup</span>
                    </div>
                    <span className="text-[11px] text-success font-semibold">
                      ₦0 (Free pickup)
                    </span>
                  </button>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="p-3.5 bg-base-200/50 rounded-2xl space-y-1.5 text-xs">
                <div className="flex justify-between text-base-content/70">
                  <span>Food Subtotal</span>
                  <span className="font-bold">₦{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-base-content/70">
                  <span>
                    {fulfillmentType === "delivery"
                      ? "Delivery Fee"
                      : "Self Pickup Fee"}
                  </span>
                  <span className="font-bold">
                    {deliveryFee === 0 ? "FREE" : `₦${deliveryFee.toLocaleString()}`}
                  </span>
                </div>
                <div className="pt-2 border-t border-base-200 flex justify-between text-sm font-black text-base-content">
                  <span>Total Amount</span>
                  <span className="text-primary text-base">
                    ₦{totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Customer Account & Contact Details Form */}
              <form id="checkout-form" onSubmit={handleCheckout} className="space-y-3">
                <h4 className="font-black text-xs text-base-content uppercase tracking-wider">
                  Contact & Account Details
                </h4>

                <div className="space-y-2.5">
                  <div>
                    <label className="label text-[11px] font-bold py-0.5 text-base-content/80">
                      Your Full Name *
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-base-content/40 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="e.g. Amaka Okafor"
                        className="input input-bordered input-sm pl-8 w-full rounded-xl text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="label text-[11px] font-bold py-0.5 text-base-content/80">
                        Email Address (Creates Account) *
                      </label>
                      <div className="relative">
                        <Mail className="w-3.5 h-3.5 text-base-content/40 absolute left-3 top-2.5" />
                        <input
                          type="email"
                          required
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          placeholder="amaka@email.com"
                          className="input input-bordered input-sm pl-8 w-full rounded-xl text-xs font-semibold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="label text-[11px] font-bold py-0.5 text-base-content/80">
                        Phone Number *
                      </label>
                      <div className="relative">
                        <Phone className="w-3.5 h-3.5 text-base-content/40 absolute left-3 top-2.5" />
                        <input
                          type="tel"
                          required
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="0803 123 4567"
                          className="input input-bordered input-sm pl-8 w-full rounded-xl text-xs font-mono font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Conditional Destination based on fulfillmentType */}
                {fulfillmentType === "delivery" ? (
                  <div className="space-y-2.5 pt-1">
                    <h4 className="font-black text-xs text-base-content uppercase tracking-wider">
                      Delivery Address
                    </h4>
                    <div>
                      <input
                        type="text"
                        required
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="House / Street address (e.g. Flat 4, 12 Borno Way, Yaba)"
                        className="input input-bordered input-sm w-full rounded-xl text-xs"
                      />
                    </div>

                    <div>
                      <input
                        type="text"
                        value={deliveryLandmark}
                        onChange={(e) => setDeliveryLandmark(e.target.value)}
                        placeholder="Nearest Landmark (e.g. Near Ozone Cinemas)"
                        className="input input-bordered input-sm w-full rounded-xl text-xs"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-base-200/60 rounded-2xl text-xs border border-base-200">
                    <div className="font-bold text-primary flex items-center gap-1.5 mb-1">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      Pickup Location
                    </div>
                    <p className="text-base-content font-semibold">
                      {vendor.business_name}
                    </p>
                    <p className="text-base-content/70 mt-0.5">
                      {vendor.address}, {vendor.city_area}
                    </p>
                    {vendor.landmark && (
                      <p className="text-[11px] text-base-content/50 mt-0.5">
                        Landmark: {vendor.landmark}
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <textarea
                    rows={2}
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder="Optional notes for chef (e.g. extra pepper, no onions, call on arrival)"
                    className="textarea textarea-bordered textarea-sm w-full rounded-xl text-xs"
                  />
                </div>
              </form>
            </div>

            {/* Drawer Footer with Sticky Button */}
            <div className="p-4 sm:p-5 border-t border-base-200 bg-base-100 shrink-0">
              <button
                type="submit"
                form="checkout-form"
                disabled={isCheckingOut || !vendorStatus.isAcceptingOrders}
                className="btn btn-primary w-full rounded-xl text-white font-black text-sm shadow-lg shadow-primary/25 py-3"
              >
                {isCheckingOut ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Placing Order...
                  </span>
                ) : (
                  <span>
                    Place Order • ₦{totalAmount.toLocaleString()}{" "}
                    {fulfillmentType === "pickup" ? "(Pickup)" : "(Delivery)"}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
