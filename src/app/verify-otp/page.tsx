"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { verifyCustomerOtp, sendCustomerOtp } from "@/app/customer/actions";
import { verifyVendorOtp, sendVendorOtp } from "@/app/vendor/actions";
import OtpInput from "@/components/OtpInput";
import { ChefHat, ArrowLeft, Mail, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const emailParam = searchParams.get("email") || "";
  const typeParam = (searchParams.get("type") || "customer") as "customer" | "vendor";
  const modeParam = searchParams.get("mode") || "login";

  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(45);

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const isVendor = typeParam === "vendor";
  const backHref = isVendor ? "/vendor/login" : "/login";

  const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      setErrorMsg("Please enter all 6 digits of the verification code.");
      return;
    }
    if (!email) {
      setErrorMsg("Missing email address. Please return to login.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append("email", email);
    formData.append("token", otp);
    formData.append("mode", modeParam);

    try {
      const res = isVendor
        ? await verifyVendorOtp(null, formData)
        : await verifyCustomerOtp(null, formData);

      setIsLoading(false);
      if (res?.error) {
        setErrorMsg(res.error);
      }
    } catch {
      // In Next.js, redirect() triggers a redirect throw which Next catches.
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || isResending) return;
    if (!email) {
      setErrorMsg("No email address provided to resend code to.");
      return;
    }

    setIsResending(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append("email", email);
    formData.append("mode", modeParam);

    const res = isVendor
      ? await sendVendorOtp(null, formData)
      : await sendCustomerOtp(null, formData);

    setIsResending(false);

    if (res?.error) {
      setErrorMsg(res.error);
    } else {
      setSuccessMsg("A fresh 6-digit code has been sent to your email.");
      setCountdown(60);
      setOtp("");
    }
  };

  return (
    <div className="min-h-screen bg-base-200/50 flex flex-col justify-center px-4 py-8 sm:px-6">
      <div className="max-w-md w-full mx-auto">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-xs font-semibold text-base-content/60 hover:text-primary mb-5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {isVendor ? "Vendor Login" : "Sign In"}
        </Link>

        {/* Brand Header */}
        <div className="text-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-primary text-primary-content flex items-center justify-center mx-auto mb-3 shadow-lg shadow-primary/25">
            <ChefHat className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            <span className="text-primary">CYGLASE</span>{" "}
            <span className="text-secondary">{isVendor ? "VENDOR" : "FOODS"}</span>
          </h1>
          <p className="text-xs font-semibold text-base-content/60 mt-1">
            {isVendor
              ? "Verify your kitchen email to access your vendor dashboard"
              : "Verify your email to start ordering delicious dishes"}
          </p>
        </div>

        {/* Card */}
        <div className="card bg-base-100 shadow-xl border border-base-200 rounded-3xl">
          <div className="card-body p-5 sm:p-7">
            {errorMsg && (
              <div role="alert" className="alert alert-error text-xs py-2.5 mb-3 rounded-xl text-white flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div role="alert" className="alert alert-success text-xs py-2.5 mb-3 rounded-xl text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="text-center mb-3">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 text-xs py-2 px-3.5 rounded-xl font-bold max-w-full">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Code sent to: {email || "your email"}</span>
              </div>
            </div>

            <form onSubmit={handleVerify} className="flex flex-col gap-4">
              <div className="form-control my-1">
                <label className="label py-1 justify-center">
                  <span className="label-text font-bold text-xs text-center text-base-content/80">
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
                disabled={isLoading || otp.length < 6}
                className="btn btn-primary w-full mt-1 font-black shadow-lg shadow-primary/25 rounded-xl text-white text-sm py-3.5"
              >
                {isLoading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : isVendor ? (
                  "Verify & Open Kitchen"
                ) : (
                  "Confirm & Start Ordering 🍲"
                )}
              </button>

              {/* Resend Code Section */}
              <div className="flex flex-col items-center gap-2 mt-2 pt-3 border-t border-base-200 text-xs text-base-content/70">
                <div className="flex items-center gap-2">
                  <span>Didn&apos;t receive the code?</span>
                  {countdown > 0 ? (
                    <span className="font-bold text-base-content/40">
                      Resend in {countdown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={isResending}
                      className="text-primary font-bold hover:underline inline-flex items-center gap-1"
                    >
                      {isResending ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : null}
                      Resend Code
                    </button>
                  )}
                </div>

                <Link
                  href={backHref}
                  className="text-xs text-base-content/50 hover:text-base-content mt-1 hover:underline"
                >
                  Use a different email address
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-base-200/50 flex items-center justify-center p-4">
          <span className="loading loading-spinner loading-md text-primary"></span>
        </div>
      }
    >
      <VerifyOtpContent />
    </Suspense>
  );
}
