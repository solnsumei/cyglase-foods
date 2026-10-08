"use client";

import { useState, useMemo, useEffect } from "react";
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
  Globe,
  QrCode,
  Copy,
  Check,
  Share2,
  Download,
} from "lucide-react";
import QRCode from "qrcode";
import { updateVendorSettings, getDbLocations } from "../../actions";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import ConfirmModal from "@/components/ConfirmModal";
import type { Database } from "@/types/database.types";
import type { StateRow } from "@/lib/locations";

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

export default function VendorSettingsClient({
  vendor,
  locationStates = [],
}: {
  vendor: Vendor;
  locationStates?: StateRow[];
}) {
  const router = useRouter();
  const [locations, setLocations] = useState<StateRow[]>(locationStates);

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  // Form State
  const [businessName, setBusinessName] = useState(vendor.business_name);
  const [slug, setSlug] = useState(vendor.slug || "");
  const [phone, setPhone] = useState(vendor.phone);
  const [isPhonePublic, setIsPhonePublic] = useState(vendor.is_phone_public);

  // Sharing & QR Code State
  const [origin, setOrigin] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const fullStoreUrl = `${origin || "https://cyglase-foods.com"}/store/${slug || vendor.slug}`;

  // Automatically regenerate QR code whenever slug or origin updates
  useEffect(() => {
    const currentSlug = slug || vendor.slug;
    if (currentSlug) {
      const url = `${origin || "https://cyglase-foods.com"}/store/${currentSlug}`;
      QRCode.toDataURL(url, {
        width: 480,
        margin: 2,
        color: {
          dark: "#0f172a",
          light: "#ffffff",
        },
      })
        .then((dataUrl) => setQrCodeDataUrl(dataUrl))
        .catch((err) => console.error("Error generating QR:", err));
    }
  }, [slug, vendor.slug, origin]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullStoreUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleDownloadQr = () => {
    if (!qrCodeDataUrl) return;
    const a = document.createElement("a");
    a.href = qrCodeDataUrl;
    a.download = `${slug || vendor.slug || "kitchen"}-store-qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${businessName} on Cyglase Foods`,
          text: `Order fresh food directly from ${businessName}!`,
          url: fullStoreUrl,
        });
        return;
      } catch {
        // User cancelled or share error
      }
    }
    // Fallback: Copy link
    handleCopyLink();
  };

  // Address
  const [state, setState] = useState(vendor.state || "Lagos");
  const [city, setCity] = useState(vendor.city || "Lagos");
  const [cityArea, setCityArea] = useState(vendor.city_area || "");
  const [address, setAddress] = useState(vendor.address || "");
  const [landmark, setLandmark] = useState(vendor.landmark || "");

  // Load locations dynamically if not supplied via props
  useEffect(() => {
    if (locations.length === 0) {
      getDbLocations().then((res) => {
        if (res && res.length > 0) setLocations(res);
      });
    }
  }, [locations.length]);

  // Compute available cities for currently selected state
  const currentCities = useMemo(() => {
    const matched = locations.find(
      (s) => s.name.toLowerCase() === (state || "").toLowerCase()
    );
    return matched?.cities || [];
  }, [locations, state]);

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
    formData.append("slug", slug);
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
      <div>
        <h1 className="text-xl font-bold tracking-tight text-base-content flex items-center gap-2">
          <Store className="w-5 h-5 text-primary" />
          Kitchen Settings
        </h1>
        <p className="text-xs sm:text-sm text-base-content/60 mt-0.5">
          Manage your payout bank, kitchen hours & location
        </p>
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

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Column 1: Business Profile & Operating Hours */}
        <div className="space-y-4">
          {/* Section 1: Business Profile & Contact Details (TOP) */}
          <div className="card bg-base-100 shadow-sm border border-base-200 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center gap-2 pb-3 border-b border-base-200 mb-4">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-black text-sm text-base-content">
                  Business & Store Details
                </h2>
                <p className="text-[11px] text-base-content/60">
                  Your kitchen brand name and public storefront settings
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
                  placeholder="e.g. Cyglase Foods"
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
                  placeholder="e.g. 08012345678"
                  className="input input-bordered w-full rounded-xl text-sm font-semibold"
                />
              </div>

              {/* Phone Visibility Toggle */}
              <div className="p-3 bg-base-200/50 rounded-xl flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-xs text-base-content flex items-center gap-1.5">
                    {isPhonePublic ? (
                      <Eye className="w-3.5 h-3.5 text-primary" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5 text-base-content/60" />
                    )}
                    Display phone on storefront
                  </div>
                  <div className="text-[11px] text-base-content/60">
                    {isPhonePublic
                      ? "Phone number is visible to customers on your public page"
                      : "Phone number is hidden from the public storefront"}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isPhonePublic}
                  onChange={(e) => setIsPhonePublic(e.target.checked)}
                  className="toggle toggle-primary toggle-sm"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Public Storefront Link & Customer QR Code (DEDICATED CARD) */}
          <div className="card bg-base-100 shadow-sm border border-base-200 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center gap-2 pb-3 border-b border-base-200 mb-4">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <QrCode className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-black text-sm text-base-content">
                  Store Link & QR Code
                </h2>
                <p className="text-[11px] text-base-content/60">
                  Your kitchen web address and printable customer ordering QR code
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Store Link Slug Customization */}
              <div>
                <label className="label text-xs font-bold text-base-content/80 pb-1 flex items-center justify-between">
                  <span>Store Web Address (Slug)</span>
                  <span className="text-[10px] text-base-content/50 font-normal">Custom URL</span>
                </label>
                <div className="join w-full">
                  <span className="join-item px-3 bg-base-200 border border-base-300 flex items-center text-xs text-base-content/60 font-mono select-none">
                    /store/
                  </span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => {
                      const formatted = e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, "-")
                        .replace(/-+/g, "-");
                      setSlug(formatted);
                    }}
                    placeholder="e.g. mama-put-kitchen"
                    className="join-item input input-bordered w-full rounded-r-xl text-sm font-mono font-bold"
                  />
                </div>
                <div className="text-[11px] text-base-content/60 mt-1 flex items-center justify-between">
                  <span className="font-mono text-primary truncate max-w-[200px] sm:max-w-xs">{fullStoreUrl}</span>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="text-primary font-bold hover:underline shrink-0 ml-2"
                  >
                    {copiedLink ? "✓ Copied!" : "Copy Link"}
                  </button>
                </div>
              </div>

              {/* QR Code Prominent Visual Card */}
              <div className="p-4 bg-base-200/50 rounded-2xl border border-base-200 flex flex-col sm:flex-row items-center gap-4">
                <div className="bg-white p-3 rounded-2xl border border-base-300 shadow-xs shrink-0 flex items-center justify-center">
                  {qrCodeDataUrl ? (
                    <img
                      src={qrCodeDataUrl}
                      alt={`${businessName} QR Code`}
                      className="w-28 h-28 object-contain"
                    />
                  ) : (
                    <div className="w-28 h-28 flex items-center justify-center text-xs text-base-content/40">
                      Generating QR...
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <div>
                    <h3 className="text-xs font-bold text-base-content flex items-center justify-center sm:justify-start gap-1.5">
                      <QrCode className="w-3.5 h-3.5 text-primary" />
                      Printable Store QR Code
                    </h3>
                    <p className="text-[11px] text-base-content/60 mt-0.5">
                      Place on table stands, takeout bags, and flyers. Customers scan to order directly.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleDownloadQr}
                      className="btn btn-xs sm:btn-sm btn-primary rounded-xl gap-1 text-white font-bold"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download QR (PNG)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleShare}
                      className="btn btn-xs sm:btn-sm btn-outline border-base-300 rounded-xl gap-1 text-xs"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share QR</span>
                    </button>

                    <a
                      href={`/store/${slug || vendor.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-xs sm:btn-sm btn-ghost border border-base-200 rounded-xl gap-1 text-xs"
                      title="Open storefront in new tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Visit</span>
                    </a>
                  </div>
                </div>
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
        </div>
        {/* End Column 1 */}

        {/* Column 2: Bank Payout & Pickup Address */}
        <div className="space-y-4">
          {/* Section 3: Customer Bank Transfer Settlement Details */}
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

              <div className="bg-amber-50 border-2 border-amber-300 dark:bg-amber-950/50 dark:border-amber-700 rounded-xl p-3.5 text-xs text-amber-950 dark:text-amber-100 font-medium">
                <span className="font-black text-amber-900 dark:text-amber-200 block mb-0.5">⚠️ Double-check your account:</span>
                When you accept an order, the customer is prompted to make a direct bank transfer to this account.
              </div>
            </div>
          </div>

          {/* Section 4: Kitchen Location & Pickup Address */}
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="label text-xs font-bold text-base-content/80 pb-1">
                    State
                  </label>
                  <select
                    value={state}
                    onChange={(e) => {
                      const newState = e.target.value;
                      setState(newState);
                      const matched = locations.find(
                        (s) => s.name.toLowerCase() === newState.toLowerCase()
                      );
                      if (matched && matched.cities && matched.cities.length > 0) {
                        setCity(matched.name.split(" ")[0]);
                      }
                    }}
                    className="select select-bordered w-full rounded-xl text-sm font-semibold"
                  >
                    {locations.length > 0 ? (
                      locations.map((s) => (
                        <option key={s.id} value={s.name}>
                          {s.name}
                        </option>
                      ))
                    ) : (
                      <option value={state}>{state}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="label text-xs font-bold text-base-content/80 pb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Lagos"
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
                    placeholder="e.g. Yaba or Ipaja"
                    className="input input-bordered w-full rounded-xl text-sm font-semibold"
                  />
                  <datalist id="area-list">
                    {currentCities.map((c) => (
                      <option key={c.id} value={c.name} />
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
        </div>
        {/* End Column 2 */}

        {/* Actions at the bottom: Sign Out & Save Settings */}
        <div className="pt-6 lg:col-span-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-base-200">
          <button
            type="button"
            onClick={() => setShowSignOutConfirm(true)}
            className="btn btn-ghost btn-sm text-error hover:bg-error/10 gap-1.5 rounded-xl order-2 sm:order-1"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out of Kitchen</span>
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="btn btn-primary w-full sm:w-auto px-8 shadow-md shadow-primary/20 text-white font-black text-sm rounded-xl py-3 order-1 sm:order-2"
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
