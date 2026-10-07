"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { sendVendorOtp, verifyVendorOtp } from "../actions";
import Link from "next/link";
import OtpInput from "@/components/OtpInput";
import {
  Utensils,
  Mail,
  KeyRound,
  ArrowLeft,
  Store,
  Sparkles,
  CheckCircle,
  ChefHat,
} from "lucide-react";

function VendorLoginContent() {
  const searchParams = useSearchParams();
  const modeParam = searchParams.get("mode") || searchParams.get("tab");
  const initialMode: "login" | "register" =
    modeParam === "register" || modeParam === "signup" ? "register" : "login";

  const [authMode, setAuthMode] = useState<"login" | "register">(initialMode);
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
    const res = await sendVendorOtp(null, formData);
    setIsLoading(false);

    if (res?.error) {
      setErrorMsg(res.error);
    } else if (res?.success) {
      setEmail(res.email || "");
      setOtp("");
      setStep("otp");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      setErrorMsg("Please enter all 6 digits of the code");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);
    formData.append("email", email);
    formData.set("token", otp);
    const res = await verifyVendorOtp(null, formData);
    setIsLoading(false);

    if (res?.error) {
      setErrorMsg(res.error);
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
            <span className="text-secondary">VENDOR</span>
          </h1>
          <p className="text-xs font-semibold text-base-content/60 mt-1">
            Grow your food business & receive direct bank transfers
          </p>
        </div>

        {/* Auth Mode Toggle Tabs (Register vs Log In) */}
        {step === "email" && (
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
              <span>Register Kitchen</span>
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
              <Store className="w-3.5 h-3.5" />
              <span>Vendor Log In</span>
            </button>
          </div>
        )}

        {/* Card */}
        <div className="card bg-base-100 shadow-xl border border-base-200 rounded-3xl">
          <div className="card-body p-5 sm:p-7">
            {errorMsg && (
              <div role="alert" className="alert alert-error text-xs py-2.5 mb-4 rounded-xl text-white">
                <span>{errorMsg}</span>
              </div>
            )}

            {step === "email" ? (
              <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
                {authMode === "register" ? (
                  <div className="bg-primary/5 border border-primary/15 rounded-2xl p-3.5 mb-1">
                    <h3 className="font-black text-xs text-primary flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Quick 2-Minute Onboarding
                    </h3>
                    <p className="text-[11px] text-base-content/70 mt-1 leading-relaxed">
                      Enter your email to verify and set up your kitchen storefront, dishes, and bank payout details.
                    </p>
                  </div>
                ) : (
                  <div className="text-left mb-1">
                    <h3 className="font-black text-sm text-base-content">
                      Welcome Back, Chef!
                    </h3>
                    <p className="text-[11px] text-base-content/60">
                      Sign in to manage your kitchen orders and live menu stock.
                    </p>
                  </div>
                )}

                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs text-base-content/80">
                      {authMode === "register" ? "Business Email Address" : "Registered Vendor Email"}
                    </span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-base-content/40 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="e.g. chef@mamatolafoods.com"
                      className="input input-bordered input-md pl-10 w-full focus:input-primary text-sm rounded-xl font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary w-full mt-1 font-black shadow-lg shadow-primary/25 rounded-xl text-white text-sm py-3.5"
                >
                  {isLoading ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : authMode === "register" ? (
                    "Register & Get Started 🚀"
                  ) : (
                    "Send One-Time Login Code"
                  )}
                </button>

                <p className="text-[11px] text-base-content/50 text-center">
                  🔒 Passwordless login with Supabase OTP email verification
                </p>

                {/* Footer Switcher */}
                <div className="pt-2 border-t border-base-200 text-center text-xs text-base-content/70">
                  {authMode === "register" ? (
                    <span>
                      Already have a vendor account?{" "}
                      <button
                        type="button"
                        onClick={() => setAuthMode("login")}
                        className="text-primary font-bold hover:underline"
                      >
                        Sign in here
                      </button>
                    </span>
                  ) : (
                    <span>
                      Want to sell your food on Cyglase?{" "}
                      <button
                        type="button"
                        onClick={() => setAuthMode("register")}
                        className="text-primary font-bold hover:underline"
                      >
                        Register your kitchen
                      </button>
                    </span>
                  )}
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                <div className="text-center mb-1">
                  <span className="badge badge-primary/10 text-primary border-primary/20 text-xs py-2 px-3 rounded-xl font-bold">
                    6-digit code sent to {email}
                  </span>
                </div>

                <div className="form-control my-1">
                  <label className="label py-1 justify-center">
                    <span className="label-text font-bold text-xs text-center">
                      Enter 6-Digit Verification Code
                    </span>
                  </label>
                  <OtpInput
                    value={otp}
                    onChange={setOtp}
                    disabled={isLoading}
                    autoFocus={true}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary w-full mt-1 font-black shadow-lg shadow-primary/25 rounded-xl text-white text-sm"
                >
                  {isLoading ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : authMode === "register" ? (
                    "Verify & Complete Setup"
                  ) : (
                    "Verify & Open Kitchen"
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="btn btn-ghost btn-xs text-base-content/60"
                >
                  Use a different email
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Feature Badges for Onboarding Confidence */}
        <div className="grid grid-cols-3 gap-2 mt-6 text-center text-[11px] text-base-content/70">
          <div className="p-2.5 bg-base-100 rounded-2xl border border-base-200">
            <span className="font-bold text-primary block">0% Signup Fee</span>
            Free registration
          </div>
          <div className="p-2.5 bg-base-100 rounded-2xl border border-base-200">
            <span className="font-bold text-primary block">Direct Payouts</span>
            Customer bank transfers
          </div>
          <div className="p-2.5 bg-base-100 rounded-2xl border border-base-200">
            <span className="font-bold text-primary block">Instant Control</span>
            Live stock & hours
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VendorLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-base-200/50 flex items-center justify-center p-4">
          <span className="loading loading-spinner loading-md text-primary"></span>
        </div>
      }
    >
      <VendorLoginContent />
    </Suspense>
  );
}
