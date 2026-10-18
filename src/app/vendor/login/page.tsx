"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { sendVendorOtp, getDbLocations } from "../actions";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  Mail,
  ArrowLeft,
  Store,
  Sparkles,
  ChefHat,
  Phone,
  MapPin,
} from "lucide-react";

function VendorLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modeParam = searchParams.get("mode") || searchParams.get("tab");
  const initialMode: "login" | "register" =
    modeParam === "register" || modeParam === "signup" ? "register" : "login";

  const [authMode, setAuthMode] = useState<"login" | "register">(initialMode);
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState("Lagos");
  const [cityArea, setCityArea] = useState("");
  const [dbLocations, setDbLocations] = useState<any[]>([]);
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

  // Load active states and cities directly from database
  useEffect(() => {
    getDbLocations().then((locs) => {
      if (locs && locs.length > 0) {
        setDbLocations(locs);
        if (!state) {
          setState(locs[0].name);
        }
      }
    });
  }, []);

  const handleSendOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);
    formData.append("mode", authMode);
    if (authMode === "register") {
      formData.append("business_name", businessName);
      formData.append("phone", phone);
      formData.append("state", state);
      formData.append("city_area", cityArea);
    }
    const res = await sendVendorOtp(null, formData);
    setIsLoading(false);

    if (res?.error) {
      setErrorMsg(res.error);
    } else if (res?.success) {
      const email = res.email || "";
      router.push(`/verify-otp?email=${encodeURIComponent(email)}&type=vendor&mode=${authMode}`);
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

        {/* Card */}
        <div className="card bg-base-100 shadow-xl border border-base-200 rounded-3xl">
          <div className="card-body p-5 sm:p-7">
            {errorMsg && (
              <div role="alert" className="alert alert-error text-xs py-2.5 mb-4 rounded-xl text-white">
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
              {authMode === "register" ? (
                <>
                  <div className="bg-primary/5 border border-primary/15 rounded-2xl p-3.5 mb-1">
                    <h3 className="font-black text-xs text-primary flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Kitchen Vendor Registration
                    </h3>
                    <p className="text-[11px] text-base-content/70 mt-1 leading-relaxed">
                      Enter your business name, contact info, and kitchen location to get listed.
                    </p>
                  </div>

                  {/* Business Name */}
                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-bold text-xs text-base-content/80">
                        Kitchen / Brand Name
                      </span>
                    </label>
                    <div className="relative">
                      <Store className="w-4 h-4 text-base-content/40 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="e.g. Mama Put Express, Iya Basira Kitchen"
                        className="input input-bordered input-md pl-10 w-full focus:input-primary text-sm rounded-xl font-medium"
                      />
                    </div>
                  </div>

                  {/* Business Phone */}
                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-bold text-xs text-base-content/80">
                        Phone Number (For WhatsApp & Orders)
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

                  {/* State & City/Area Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="form-control">
                      <label className="label py-1">
                        <span className="label-text font-bold text-xs text-base-content/80">
                          State
                        </span>
                      </label>
                      <select
                        value={state}
                        onChange={(e) => {
                          setState(e.target.value);
                          setCityArea("");
                        }}
                        className="select select-bordered select-md w-full focus:select-primary text-sm rounded-xl font-medium"
                      >
                        {dbLocations.map((loc) => (
                          <option key={loc.id} value={loc.name}>
                            {loc.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-control">
                      <label className="label py-1">
                        <span className="label-text font-bold text-xs text-base-content/80">
                          Neighborhood / Area
                        </span>
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-base-content/40 absolute left-3.5 top-3.5 pointer-events-none" />
                        <input
                          type="text"
                          required
                          value={cityArea}
                          onChange={(e) => setCityArea(e.target.value)}
                          placeholder="e.g. Yaba, Ikeja, Lekki"
                          className="input input-bordered input-md pl-10 w-full focus:input-primary text-sm rounded-xl font-medium"
                          list="area-suggestions"
                        />
                        <datalist id="area-suggestions">
                          {dbLocations
                            .find((loc) => loc.name === state)
                            ?.cities?.map((c: any) => (
                              <option key={c.id} value={c.name} />
                            ))}
                        </datalist>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}

              {/* Email Address */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-bold text-xs text-base-content/80">
                    Business Email Address
                  </span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-base-content/40 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="chef@restaurant.com"
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
                  "Register Kitchen & Get Code"
                ) : (
                  "Send One-Time Code"
                )}
              </button>

              <p className="text-[11px] text-base-content/50 text-center">
                🔒 Passwordless login with OTP email verification
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
