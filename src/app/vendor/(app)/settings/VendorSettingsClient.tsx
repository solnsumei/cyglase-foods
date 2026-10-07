"use client";

import { useState } from "react";
import {
  Store,
  Clock,
  CreditCard,
  MapPin,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogOut,
  ExternalLink,
  Phone,
  Eye,
  EyeOff,
} from "lucide-react";
import { updateVendorSettings } from "../../actions";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import ConfirmModal from "@/components/ConfirmModal";
import type { Database } from "@/types/database.types";

type Vendor = Database["public"]["Tables"]["vendors"]["Row"];

const NIGERIAN_BANKS = [
  "OPay",
  "Moniepoint",
  "Kuda Bank",
  "Guaranty Trust Bank (GTBank)",
  "Zenith Bank",
  "Access Bank",
  "United Bank for Africa (UBA)",
  "First Bank of Nigeria",
  "Fidelity Bank",
  "Stanbic IBTC Bank",
  "Sterling Bank",
  "Wema Bank / ALAT",
  "PalmPay",
  "Other Bank",
];

const LAGOS_AREAS = [
  "Lekki Phase 1",
  "Victoria Island",
  "Ikoyi",
  "Ajah",
  "Chevron / Igbo Efon",
  "Yaba",
  "Surulere",
  "Ikeja",
  "Magodo",
  "Maryland",
  "Gbagada",
  "Festac",
  "Ogba",
  "Agege",
  "Alimosho",
  "Ikorodu",
  "Other Area",
];

export default function VendorSettingsClient({ vendor }: { vendor: Vendor }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  // Form State
  const [businessName, setBusinessName] = useState(vendor.business_name);
  const [phone, setPhone] = useState(vendor.phone);
  const [isPhonePublic, setIsPhonePublic] = useState(vendor.is_phone_public);

  // Address
  const [state, setState] = useState(vendor.state || "Lagos");
  const [city, setCity] = useState(vendor.city || "Lagos");
  const [cityArea, setCityArea] = useState(vendor.city_area || "");
  const [address, setAddress] = useState(vendor.address || "");
  const [landmark, setLandmark] = useState(vendor.landmark || "");

  // Schedule
  const [openingTime, setOpeningTime] = useState(
    vendor.opening_time ? vendor.opening_time.slice(0, 5) : "08:00"
  );
  const [closingTime, setClosingTime] = useState(
    vendor.closing_time ? vendor.closing_time.slice(0, 5) : "22:00"
  );

  // Bank details for manual customer transfer
  const [bankName, setBankName] = useState(vendor.bank_name || "");
  const [accountNumber, setAccountNumber] = useState(vendor.account_number || "");
  const [accountName, setAccountName] = useState(vendor.account_name || "");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("vendor_id", vendor.id);
    formData.append("business_name", businessName);
    formData.append("phone", phone);
    formData.append("is_phone_public", isPhonePublic ? "true" : "false");
    formData.append("state", state);
    formData.append("city", city);
    formData.append("city_area", cityArea);
    formData.append("address", address);
    formData.append("landmark", landmark);
    formData.append("opening_time", `${openingTime}:00`);
    formData.append("closing_time", `${closingTime}:00`);
    formData.append("bank_name", bankName);
    formData.append("account_number", accountNumber);
    formData.append("account_name", accountName);

    try {
      const res = await updateVendorSettings(formData);
      if (res?.error) {
        setErrorMessage(res.error);
      } else {
        setSuccessMessage("Settings saved successfully!");
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmSignOut = async () => {
    setShowSignOutConfirm(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/vendor/login");
    router.refresh();
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-base-content flex items-center gap-2">
            <Store className="w-6 h-6 text-primary" />
            Kitchen Settings
          </h1>
          <p className="text-xs sm:text-sm text-base-content/60">
            Manage your payout bank, kitchen hours & location
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowSignOutConfirm(true)}
          className="btn btn-ghost btn-xs sm:btn-sm text-error hover:bg-error/10 gap-1 rounded-xl"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="alert alert-success text-xs py-2.5 rounded-2xl shadow-sm text-white flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="alert alert-error text-xs py-2.5 rounded-2xl shadow-sm text-white flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        {/* Section 1: Customer Bank Transfer Settlement Details */}
        <div className="card bg-base-100 shadow-sm border border-base-200 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center gap-2 pb-3 border-b border-base-200 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-black text-sm text-base-content">
                Bank Payout Details
              </h2>
              <p className="text-[11px] text-base-content/60">
                Customers transfer directly to this account when an order is accepted
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="label text-xs font-bold text-base-content/80 pb-1">
                Bank Name
              </label>
              <input
                type="text"
                list="bank-list"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. OPay, Moniepoint, GTBank"
                className="input input-bordered w-full rounded-xl text-sm"
              />
              <datalist id="bank-list">
                {NIGERIAN_BANKS.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label text-xs font-bold text-base-content/80 pb-1">
                  10-Digit Account Number
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={accountNumber}
                  onChange={(e) =>
                    setAccountNumber(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="0123456789"
                  className="input input-bordered w-full rounded-xl text-sm font-mono tracking-wider font-semibold"
                />
              </div>

              <div>
                <label className="label text-xs font-bold text-base-content/80 pb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g. Mama Tola Foods"
                  className="input input-bordered w-full rounded-xl text-sm font-semibold"
                />
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-[11px] text-amber-900 dark:text-amber-300">
              <span className="font-bold">⚠️ Double-check your account:</span>{" "}
              When you accept an order, the customer is prompted to make a bank
              transfer to this account within the wait-time timer.
            </div>
          </div>
        </div>

        {/* Section 2: Kitchen Working Hours */}
        <div className="card bg-base-100 shadow-sm border border-base-200 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center gap-2 pb-3 border-b border-base-200 mb-4">
            <div className="w-8 h-8 rounded-full bg-secondary/10 text-secondary flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-black text-sm text-base-content">
                Kitchen Working Hours
              </h2>
              <p className="text-[11px] text-base-content/60">
                Times when your store accepts incoming food orders
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label text-xs font-bold text-base-content/80 pb-1">
                Opens At
              </label>
              <input
                type="time"
                value={openingTime}
                onChange={(e) => setOpeningTime(e.target.value)}
                className="input input-bordered w-full rounded-xl text-sm font-semibold"
              />
            </div>

            <div>
              <label className="label text-xs font-bold text-base-content/80 pb-1">
                Closes At
              </label>
              <input
                type="time"
                value={closingTime}
                onChange={(e) => setClosingTime(e.target.value)}
                className="input input-bordered w-full rounded-xl text-sm font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Kitchen Location & Pickup Address */}
        <div className="card bg-base-100 shadow-sm border border-base-200 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center gap-2 pb-3 border-b border-base-200 mb-4">
            <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-black text-sm text-base-content">
                Kitchen Pickup Address
              </h2>
              <p className="text-[11px] text-base-content/60">
                Where dispatch riders pick up cooked orders
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label text-xs font-bold text-base-content/80 pb-1">
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Lagos"
                  className="input input-bordered w-full rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="label text-xs font-bold text-base-content/80 pb-1">
                  Area / Neighborhood
                </label>
                <input
                  type="text"
                  list="area-list"
                  value={cityArea}
                  onChange={(e) => setCityArea(e.target.value)}
                  placeholder="e.g. Yaba"
                  className="input input-bordered w-full rounded-xl text-sm font-semibold"
                />
                <datalist id="area-list">
                  {LAGOS_AREAS.map((a) => (
                    <option key={a} value={a} />
                  ))}
                </datalist>
              </div>
            </div>

            <div>
              <label className="label text-xs font-bold text-base-content/80 pb-1">
                Street Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 14 Commercial Avenue, Sabo"
                className="input input-bordered w-full rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="label text-xs font-bold text-base-content/80 pb-1">
                Popular Landmark
              </label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="e.g. Near E-Center Mall"
                className="input input-bordered w-full rounded-xl text-sm"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Store Identity & Phone Privacy */}
        <div className="card bg-base-100 shadow-sm border border-base-200 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center gap-2 pb-3 border-b border-base-200 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-black text-sm text-base-content">
                Business & Contact Privacy
              </h2>
              <p className="text-[11px] text-base-content/60">
                NDPR-compliant phone masking controls
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="label text-xs font-bold text-base-content/80 pb-1">
                Business Brand Name
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="input input-bordered w-full rounded-xl text-sm font-bold"
              />
            </div>

            <div>
              <label className="label text-xs font-bold text-base-content/80 pb-1">
                Primary Phone Number
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input input-bordered w-full rounded-xl text-sm font-semibold"
              />
            </div>

            {/* Privacy Toggle */}
            <div className="p-3 bg-base-200/50 rounded-xl flex items-center justify-between gap-3">
              <div>
                <div className="font-bold text-xs text-base-content flex items-center gap-1.5">
                  {isPhonePublic ? (
                    <Eye className="w-3.5 h-3.5 text-primary" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-base-content/60" />
                  )}
                  Display phone on public store
                </div>
                <div className="text-[11px] text-base-content/60">
                  {isPhonePublic
                    ? "Your phone number is visible to all buyers"
                    : "Protected: Phone number is hidden to protect your privacy"}
                </div>
              </div>
              <input
                type="checkbox"
                checked={isPhonePublic}
                onChange={(e) => setIsPhonePublic(e.target.checked)}
                className="toggle toggle-primary toggle-sm"
              />
            </div>

            {/* Public Store Link */}
            <div className="pt-2 flex items-center justify-between text-xs text-base-content/70">
              <span className="font-medium">Public Store Link:</span>
              <a
                href={`/store/${vendor.slug}`}
                target="_blank"
                rel="noreferrer"
                className="text-primary font-bold hover:underline flex items-center gap-1"
              >
                /store/{vendor.slug}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Submit Button Sticky on Mobile */}
        <div className="sticky bottom-20 z-10">
          <button
            type="submit"
            disabled={isSaving}
            className="btn btn-primary w-full shadow-lg shadow-primary/30 text-white font-black text-sm rounded-xl py-3.5"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Saving Changes...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="w-4 h-4" /> Save Settings
              </span>
            )}
          </button>
        </div>
      </form>

      {/* In-app Sign Out Confirmation Modal */}
      <ConfirmModal
        isOpen={showSignOutConfirm}
        title="Sign Out of Kitchen"
        message="Are you sure you want to log out of your vendor portal?"
        confirmText="Sign Out"
        cancelText="Stay Logged In"
        type="warning"
        onConfirm={handleConfirmSignOut}
        onCancel={() => setShowSignOutConfirm(false)}
      />
    </div>
  );
}
