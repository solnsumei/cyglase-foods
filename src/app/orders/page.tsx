import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import {
  ShoppingBag,
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  ChevronRight,
  UtensilsCrossed,
} from "lucide-react";
import CustomerBottomNav from "@/components/CustomerBottomNav";

export const dynamic = "force-dynamic";

export default async function CustomerOrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const adminClient = createAdminClient();

  let orders: any[] = [];
  if (user) {
    const { data } = await adminClient
      .from("orders")
      .select("*, vendors(business_name, slug), order_items(*)")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false });
    orders = data || [];
  }

  return (
    <div className="min-h-screen bg-base-200/40 pb-24 md:pb-12">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-base-100/90 backdrop-blur-md border-b border-base-200 px-4 py-3 sm:px-6">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="btn btn-ghost btn-xs sm:btn-sm gap-1 text-base-content/70 hover:text-primary rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-semibold text-xs">Food Market</span>
          </Link>

          <h1 className="font-black text-sm text-base-content flex items-center gap-1.5">
            <ShoppingBag className="w-4 h-4 text-primary" />
            My Food Orders
          </h1>

          <div className="w-8"></div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-xl mx-auto p-4 sm:p-6 space-y-4">
        {!user ? (
          <div className="card bg-base-100 shadow-sm border border-base-200 rounded-3xl p-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <h2 className="font-black text-lg text-base-content">
              Sign In to View Orders
            </h2>
            <p className="text-xs text-base-content/60 max-w-xs mx-auto">
              Log in with your email to see live cooking updates, rider tracking, and receipt history.
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="btn btn-primary btn-sm rounded-xl text-white font-bold px-6 shadow-md shadow-primary/20"
              >
                Sign In / Register
              </Link>
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div className="card bg-base-100 shadow-sm border border-base-200 rounded-3xl p-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-base-200 text-base-content/40 flex items-center justify-center mx-auto">
              <UtensilsCrossed className="w-7 h-7" />
            </div>
            <h2 className="font-black text-base text-base-content">
              No orders placed yet
            </h2>
            <p className="text-xs text-base-content/60 max-w-xs mx-auto">
              Craving Jollof, piping Egusi, or spicy Suya? Order fresh meals from our top local kitchens.
            </p>
            <div className="pt-2">
              <Link
                href="/"
                className="btn btn-primary btn-sm rounded-xl text-white font-bold px-6 shadow-md shadow-primary/20"
              >
                Explore Cuisines 🍲
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const statusLabels: Record<string, { label: string; color: string }> = {
                pending_acceptance: { label: "Waiting for Kitchen", color: "badge-warning" },
                awaiting_payment: { label: "Transfer & Receipt Needed", color: "badge-secondary" },
                payment_uploaded: { label: "Receipt Uploaded", color: "badge-primary" },
                preparing: { label: "Cooking in Kitchen", color: "badge-success" },
                out_for_delivery: { label: "Out for Delivery", color: "badge-primary" },
                delivered: { label: "Delivered", color: "badge-ghost" },
                cancelled: { label: "Cancelled", color: "badge-error" },
                rejected: { label: "Declined", color: "badge-error" },
              };

              const status = statusLabels[order.status] || {
                label: order.status,
                color: "badge-ghost",
              };

              return (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="card bg-base-100 shadow-sm border border-base-200 rounded-2xl p-4 hover:border-primary/40 transition-all flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`badge badge-xs ${status.color} font-bold text-[10px]`}>
                          {status.label}
                        </span>
                        <span className="text-[10px] text-base-content/50">
                          {new Date(order.created_at).toLocaleDateString("en-NG", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-base-content">
                        {order.vendors?.business_name || "Food Kitchen"}
                      </h3>
                      <p className="text-xs text-base-content/60 mt-0.5 line-clamp-1">
                        {order.order_items
                          ?.map((i: any) => `${i.quantity}x ${i.item_name}`)
                          .join(", ")}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-black text-sm text-primary">
                        ₦{Number(order.total_amount).toLocaleString()}
                      </div>
                      <span className="text-[10px] text-base-content/50">
                        {order.order_items?.length || 0} items
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-base-200 flex items-center justify-between text-xs text-primary font-bold">
                    <span>View Live Status & Receipt</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <CustomerBottomNav isLoggedIn={!!user} />
    </div>
  );
}
