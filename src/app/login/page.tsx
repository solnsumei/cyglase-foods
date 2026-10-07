"use client";

import { useState } from "react";
import { sendCustomerOtp, verifyCustomerOtp } from "../customer/actions";
import Link from "next/link";
import {
  Mail,
  KeyRound,
  ArrowLeft,
  Utensils,
  Phone,
  User,
  ShoppingBag,
  Store,
  Sparkles,
} from "lucide-react";

export default function CustomerLoginPage() {
  const [authMode, setAuthMode] = useState<"register" | "login">("register");
  const [step, setStep] = useState<"details" | "otp">("details");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);
    formData.append("full_name", fullName);
    formData.append("phone", phone);

    const res = await sendCustomerOtp(null, formData);
    setIsLoading(false);

    if (res?.error) {
      setErrorMsg(res.error);
    } else if (res?.success) {
      setEmail(res.email || "");
      setStep("otp");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);
    formData.append("email", email);
    formData.append("full_name", fullName);
    formData.append("phone", phone);

    const res = await verifyCustomerOtp(null, formData);
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
          Back to Food Market
        </Link>

        {/* Brand Header */}
        <div className="text-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-secondary text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-secondary/25">
            <Utensils className="w-7 h-7" />
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
        {step === "details" && (
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
        )}

        {/* Card */}
        <div className="card bg-base-100 shadow-xl border border-base-200 rounded-3xl">
          <div className="card-body p-5 sm:p-7">
            {errorMsg && (
              <div role="alert" className="alert alert-error text-xs py-2.5 mb-4 rounded-xl text-white">
                <span>{errorMsg}</span>
              </div>
            )}

            {step === "details" ? (
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
            ) : (
              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                <div className="text-center mb-1">
                  <span className="badge badge-primary/10 text-primary border-primary/20 text-xs py-2 px-3 rounded-xl font-bold">
                    6-digit code sent to {email}
                  </span>
                </div>

                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs text-center w-full">
                      Enter Verification Code
                    </span>
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-base-content/40 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      name="token"
                      required
                      maxLength={6}
                      pattern="[0-9]{6}"
                      placeholder="123456"
                      autoFocus
                      className="input input-bordered input-md pl-10 w-full text-center font-mono font-black text-lg tracking-widest focus:input-primary rounded-xl"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary w-full mt-1 font-black shadow-lg shadow-primary/25 rounded-xl text-white text-sm"
                >
                  {isLoading ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    "Confirm & Start Ordering 🍲"
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setStep("details")}
                  className="btn btn-ghost btn-xs text-base-content/60"
                >
                  Use a different email
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
