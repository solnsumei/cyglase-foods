"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  ShoppingBag,
  Store,
  Search,
  LogOut,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Calendar,
  ChefHat,
  Save,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  Edit3,
} from "lucide-react";
import CustomerTopNav from "@/components/CustomerTopNav";
import CustomerBottomNav from "@/components/CustomerBottomNav";
import { createClient } from "@/lib/supabase/client";

interface AccountClientProps {
  user: any;
  isVendor: boolean;
  vendor: {
    id: string;
    business_name: string;
    slug: string;
    is_open: boolean;
  } | null;
  totalOrders: number;
}

export default function AccountClient({
  user,
  isVendor,
  vendor,
  totalOrders,
}: AccountClientProps) {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState(
    user?.user_metadata?.full_name || ""
  );
  const [phone, setPhone] = useState(
    user?.user_metadata?.phone || ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName.trim(),
          phone: phone.trim(),
        },
      });

      if (error) throw error;
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message || "Failed to update profile details.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Sign out error", err);
      setIsSigningOut(false);
    }
  };

  // Format member since date
  const memberDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "Recent";

  const userInitial = (
    fullName?.[0] ||
    user?.email?.[0] ||
    "U"
  ).toUpperCase();

  return (
    <div className="min-h-screen bg-base-200/40 pb-28 md:pb-16 flex flex-col">
      {/* Top Menu Bar on Desktop */}
      <CustomerTopNav user={user} isVendor={isVendor} />

      {/* Top Header on Mobile */}
      <header className="md:hidden sticky top-0 z-30 bg-base-100/90 backdrop-blur-md border-b border-base-200 px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="btn btn-ghost btn-xs sm:btn-sm gap-1 text-base-content/70 hover:text-primary rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-semibold text-xs">Back</span>
          </Link>

          <h1 className="font-black text-sm text-base-content flex items-center gap-1.5">
            <User className="w-4 h-4 text-primary" />
            My Account
          </h1>

          <div className="w-8"></div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 pt-5 space-y-6 flex-1">
        {/* Profile Card */}
        <div className="card bg-base-100 shadow-sm border border-base-200 rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-primary to-emerald-400 text-white flex items-center justify-center font-black text-3xl sm:text-4xl shadow-lg shadow-primary/20 shrink-0">
              {userInitial}
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-base-content truncate">
                  {fullName || "Customer Profile"}
                </h2>
                <span className="badge badge-primary badge-sm font-bold text-[10px]">
                  Customer
                </span>
                {isVendor && (
                  <span className="badge badge-secondary badge-sm font-bold text-[10px] gap-1">
                    <ChefHat className="w-3 h-3" />
                    Kitchen Vendor
                  </span>
                )}
              </div>

              <p className="text-sm font-medium text-base-content/70 flex items-center justify-center sm:justify-start gap-1.5">
                <Mail className="w-3.5 h-3.5 text-base-content/40" />
                <span className="truncate">{user.email}</span>
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-1 text-xs text-base-content/60">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  Member since {memberDate}
                </span>
                <span className="flex items-center gap-1">
                  <ShoppingBag className="w-3.5 h-3.5 text-secondary" />
                  {totalOrders} order{totalOrders === 1 ? "" : "s"} placed
                </span>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="btn btn-ghost btn-sm text-error hover:bg-error/10 rounded-2xl gap-1.5 self-center sm:self-start"
            >
              <LogOut className="w-4 h-4" />
              <span>{isSigningOut ? "Signing out..." : "Sign Out"}</span>
            </button>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Orders Hub */}
          <Link
            href="/orders"
            className="card bg-base-100 shadow-sm border border-base-200 hover:border-primary/40 p-5 rounded-2xl transition-all group flex flex-row items-center justify-between"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm sm:text-base text-base-content flex items-center gap-1.5">
                  My Food Orders
                  {totalOrders > 0 && (
                    <span className="badge badge-primary badge-xs font-bold text-[10px]">
                      {totalOrders}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-base-content/60 truncate mt-0.5">
                  Track active food preparation & order history
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-base-content/40 group-hover:text-primary transition-colors shrink-0 ml-2" />
          </Link>

          {/* Outlets Directory */}
          <Link
            href="/outlets"
            className="card bg-base-100 shadow-sm border border-base-200 hover:border-primary/40 p-5 rounded-2xl transition-all group flex flex-row items-center justify-between"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Store className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm sm:text-base text-base-content">
                  Food Outlets & Kitchens
                </h3>
                <p className="text-xs text-base-content/60 truncate mt-0.5">
                  Browse verified local cloud kitchens
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-base-content/40 group-hover:text-primary transition-colors shrink-0 ml-2" />
          </Link>

          {/* Search Cuisines */}
          <Link
            href="/search"
            className="card bg-base-100 shadow-sm border border-base-200 hover:border-primary/40 p-5 rounded-2xl transition-all group flex flex-row items-center justify-between"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-warning/10 text-warning flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Search className="w-6 h-6 text-amber-600" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm sm:text-base text-base-content">
                  Search Nigerian Dishes
                </h3>
                <p className="text-xs text-base-content/60 truncate mt-0.5">
                  Find party jollof, egusi, suya, and drinks
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-base-content/40 group-hover:text-primary transition-colors shrink-0 ml-2" />
          </Link>

          {/* Vendor Dashboard or Sell Food */}
          {isVendor ? (
            <Link
              href="/vendor"
              className="card bg-base-100 shadow-sm border border-primary/30 hover:border-primary p-5 rounded-2xl transition-all group flex flex-row items-center justify-between"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-md shadow-primary/20">
                  <ChefHat className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm sm:text-base text-primary">
                    Kitchen Vendor Dashboard
                  </h3>
                  <p className="text-xs text-base-content/60 truncate mt-0.5">
                    {vendor?.business_name || "Manage menu, orders & bank"}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-primary shrink-0 ml-2" />
            </Link>
          ) : (
            <Link
              href="/vendor/login"
              className="card bg-base-100 shadow-sm border border-secondary/30 hover:border-secondary p-5 rounded-2xl transition-all group flex flex-row items-center justify-between"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <ChefHat className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm sm:text-base text-base-content flex items-center gap-1.5">
                    Sell Food on Cyglase
                    <span className="badge badge-secondary badge-xs font-bold text-[9px]">
                      Earn
                    </span>
                  </h3>
                  <p className="text-xs text-base-content/60 truncate mt-0.5">
                    Register your cloud kitchen or restaurant
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-base-content/40 group-hover:text-secondary transition-colors shrink-0 ml-2" />
            </Link>
          )}
        </div>

        {/* Profile Settings Form */}
        <div className="card bg-base-100 shadow-sm border border-base-200 rounded-3xl p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-4">
            <Edit3 className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-black text-base-content">
              Personal Details
            </h3>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-lg">
            {saveSuccess && (
              <div className="alert alert-success rounded-2xl text-xs py-2.5 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Profile details updated successfully!</span>
              </div>
            )}

            {saveError && (
              <div className="alert alert-error rounded-2xl text-xs py-2.5 font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-base-content/70 block mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Chukwuma Adebayo"
                className="input input-bordered w-full rounded-2xl text-sm bg-base-200/50 focus:input-primary font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-base-content/70 block mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={user.email || ""}
                disabled
                className="input input-bordered w-full rounded-2xl text-sm bg-base-200/80 font-medium text-base-content/60 cursor-not-allowed"
              />
              <span className="text-[10px] text-base-content/50 mt-1 block">
                Email is managed via OTP authentication.
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-base-content/70 block mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 08012345678"
                className="input input-bordered w-full rounded-2xl text-sm bg-base-200/50 focus:input-primary font-medium"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="btn btn-primary btn-sm rounded-xl text-white font-bold px-6 shadow-sm gap-2"
              >
                {isSaving ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <CustomerBottomNav isLoggedIn={true} />
    </div>
  );
}
