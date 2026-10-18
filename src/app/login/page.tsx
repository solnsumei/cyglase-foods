"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { sendCustomerOtp } from "../customer/actions";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  Mail,
  ArrowLeft,
  Phone,
  User,
  Store,
  Sparkles,
  ChefHat,
} from "lucide-react";

function CustomerLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modeParam = searchParams.get("mode") || searchParams.get("tab");
  const initialMode: "register" | "login" =
    modeParam === "register" || modeParam === "signup" ? "register" : "login";

  const [authMode, setAuthMode] = useState<"register" | "login">(initialMode);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // If already logged in as a vendor, redirect to /vendor
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const [{ data: vendor }, { data: profile }] = await Promise.all([
          supabase.from("vendors").select("id").eq("user_id", user.id).maybeSingle(),
          supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
        ]);
        if (vendor || profile?.role === "vendor") {
          router.replace("/vendor");
        }
      }
    });
  }, [router]);

  useEffect(() => {
    const mode = searchParams.get("mode") || searchParams.get("tab");
    if (mode === "register" || mode === "signup") {
      setAuthMode("register");
    } else if (mode === "login" || mode === "signin") {
      setAuthMode("login");
    }
  }, [searchParams]);

  const handleSendOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);
    formData.append("mode", authMode);
    formData.append("full_name", fullName);
    formData.append("phone", phone);

    const res = await sendCustomerOtp(null, formData);
    setIsLoading(false);

    if (res?.error) {
      setErrorMsg(res.error);
    } else if (res?.success) {
      const email = res.email || "";
      router.push(`/verify-otp?email=${encodeURIComponent(email)}&type=customer&mode=${authMode}`);
    }
  };

  return (
    <div className="min-h-screen bg-base-200/50 flex flex-col justify-center px-4 py-8 sm:px-6">
      <div className="max-w-md w-full mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-base-content/60 hover:text-primary mb-5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        {/* Brand Header */}
        <div className="text-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-primary text-primary-content flex items-center justify-center mx-auto mb-3 shadow-lg shadow-primary/25">
            <ChefHat className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            <span className="text-primary">CYGLASE</span>{" "}
            <span className="text-secondary">FOODS</span>
          </h1>
          <p className="text-xs font-semibold text-base-content/60 mt-1">
            Order authentic Nigerian dishes & drinks from local kitchens
          </p>
        </div>

        {/* Auth Mode Toggle Tabs (Register vs Sign In) */}
        <div className="grid grid-cols-2 p-1 bg-base-300/60 rounded-2xl mb-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setAuthMode("register");
              setErrorMsg(null);
            }}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              authMode === "register"
                ? "bg-base-100 text-primary shadow-sm font-black"
                : "text-base-content/60 hover:text-base-content"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-warning" />
            <span>Create Account</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode("login");
              setErrorMsg(null);
            }}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              authMode === "login"
                ? "bg-base-100 text-primary shadow-sm font-black"
                : "text-base-content/60 hover:text-base-content"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        </div>

        {/* Card */}
        <div className="card bg-base-100 shadow-xl border border-base-200 rounded-3xl">
          <div className="card-body p-5 sm:p-7">
            {errorMsg && (
              <div role="alert" className="alert alert-error text-xs py-2.5 mb-4 rounded-xl text-white">
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSendOtp} className="flex flex-col gap-3.5">
              {authMode === "register" && (
                <>
                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-bold text-xs text-base-content/80">
                        Full Name
                      </span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-base-content/40 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Tunde Adeyemi"
                        className="input input-bordered input-md pl-10 w-full focus:input-primary text-sm rounded-xl font-medium"
                      />
                    </div>
                  </div>

                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-bold text-xs text-base-content/80">
                        Phone Number (For Delivery Rider)
                      </span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-base-content/40 absolute left-3.5 top-3.5" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0803 123 4567"
                        className="input input-bordered input-md pl-10 w-full focus:input-primary text-sm rounded-xl font-mono"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-bold text-xs text-base-content/80">
                    Email Address
                  </span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-base-content/40 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="you@email.com"
                    className="input input-bordered input-md pl-10 w-full focus:input-primary text-sm rounded-xl font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full mt-2 font-black shadow-lg shadow-primary/25 rounded-xl text-white text-sm py-3.5"
              >
                {isLoading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : authMode === "register" ? (
                  "Register & Get Verification Code"
                ) : (
                  "Send One-Time Code"
                )}
              </button>

              <p className="text-[11px] text-base-content/50 text-center">
                🔒 Secure passwordless sign in. We send a 6-digit OTP code to your email.
              </p>

              {/* Footer Link for Vendors */}
              <div className="pt-3 border-t border-base-200 flex flex-wrap items-center justify-center gap-1.5 text-xs text-base-content/70">
                <span>Are you a food vendor?</span>
                <Link
                  href="/vendor/login"
                  className="text-secondary font-black hover:underline inline-flex items-center gap-1"
                >
                  <Store className="w-3.5 h-3.5 shrink-0" />
                  <span>Register Your Kitchen</span>
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CustomerLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-base-200/50 flex items-center justify-center p-4">
          <span className="loading loading-spinner loading-md text-primary"></span>
        </div>
      }
    >
      <CustomerLoginContent />
    </Suspense>
  );
}
