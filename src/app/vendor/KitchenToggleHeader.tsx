"use client";

import { useState } from "react";
import { toggleKitchenStatus } from "./actions";
import { Power, Utensils } from "lucide-react";
import Link from "next/link";

import ConfirmModal from "@/components/ConfirmModal";

export default function KitchenToggleHeader({
  vendorId,
  businessName,
  initialIsOpen,
}: {
  vendorId: string;
  businessName: string;
  initialIsOpen: boolean;
}) {
  const [isOpen, setIsOpen] = useState(initialIsOpen);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleToggle = async () => {
    setIsUpdating(true);
    const nextState = !isOpen;
    setIsOpen(nextState);
    const res = await toggleKitchenStatus(vendorId, isOpen);
    setIsUpdating(false);
    if (res?.error) {
      setIsOpen(initialIsOpen);
      setErrorMsg(res.error);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-base-100/95 backdrop-blur-md border-b border-base-300 px-4 py-3 shadow-xs">
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
        <Link href="/vendor" className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-primary text-primary-content flex items-center justify-center font-bold text-xs shrink-0 shadow-sm shadow-primary/20">
            <Utensils className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="font-black text-sm tracking-tight truncate leading-tight">
              {businessName}
            </div>
            <div className="text-[10px] text-base-content/50 font-medium">
              Vendor Portal
            </div>
          </div>
        </Link>

        {/* Live Kitchen Status Toggle */}
        <button
          onClick={handleToggle}
          disabled={isUpdating}
          className={`btn btn-xs sm:btn-sm rounded-full font-bold gap-1.5 transition-all shadow-xs ${
            isOpen
              ? "btn-success text-white"
              : "btn-ghost border border-base-300 text-base-content/60"
          }`}
        >
          <Power className="w-3.5 h-3.5" />
          <span className="text-[11px] sm:text-xs">
            {isOpen ? "Kitchen Open" : "Kitchen Closed"}
          </span>
        </button>
      </div>

      {/* In-app Error Modal */}
      <ConfirmModal
        isOpen={!!errorMsg}
        title="Kitchen Status Error"
        message={errorMsg || ""}
        confirmText="Dismiss"
        showCancel={false}
        type="warning"
        onConfirm={() => setErrorMsg(null)}
      />
    </header>
  );
}
