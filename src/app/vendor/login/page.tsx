"use client";

import { useState } from "react";
import { sendVendorOtp, verifyVendorOtp } from "../actions";
import Link from "next/link";
import { Utensils, Mail, KeyRound, ArrowLeft, Store } from "lucide-react";

export default function VendorLoginPage() {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);
    const res = await sendVendorOtp(null, formData);
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
    const res = await verifyVendorOtp(null, formData);
    setIsLoading(false);

    if (res?.error) {
      setErrorMsg(res.error);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex flex-col justify-center px-4 py-8 sm:px-6">
      <div className="max-w-md w-full mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs text-base-content/60 hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Store
        </Link>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-primary text-primary-content flex items-center justify-center mx-auto mb-3 shadow-lg shadow-primary/20">
            <Store className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            <span className="text-primary">CYGLASE</span>{" "}
            <span className="text-secondary">FOODS</span>
          </h1>
          <p className="text-xs font-semibold text-base-content/60 mt-1 uppercase tracking-wider">
            Vendor Kitchen Access
          </p>
        </div>

        {/* Card */}
        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body p-6">
            {errorMsg && (
              <div role="alert" className="alert alert-error text-xs py-2.5 mb-4">
                <span>{errorMsg}</span>
              </div>
            )}

            {step === "email" ? (
              <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs">
                      Enter Your Email Address
                    </span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-base-content/40 absolute left-3 top-3" />
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="vendor@kitchen.com"
                      className="input input-bordered input-md pl-9 w-full focus:input-primary text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary w-full mt-2 font-bold shadow-md shadow-primary/20"
                >
                  {isLoading ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    "Send Login Code"
                  )}
                </button>

                <p className="text-[11px] text-base-content/50 text-center mt-2">
                  We will email you a secure 6-digit code. No password needed!
                </p>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                <div className="text-center mb-1">
                  <span className="badge badge-primary badge-outline text-[11px] py-2 px-3">
                    Code sent to {email}
                  </span>
                </div>

                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs text-center w-full">
                      Enter 6-Digit Verification Code
                    </span>
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-base-content/40 absolute left-3 top-3" />
                    <input
                      type="text"
                      name="token"
                      required
                      maxLength={6}
                      pattern="[0-9]{6}"
                      placeholder="123456"
                      autoFocus
                      className="input input-bordered input-md pl-9 w-full text-center font-mono font-bold text-lg tracking-widest focus:input-primary"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary w-full mt-2 font-bold shadow-md shadow-primary/20"
                >
                  {isLoading ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    "Verify & Enter Kitchen"
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
      </div>
    </div>
  );
}
