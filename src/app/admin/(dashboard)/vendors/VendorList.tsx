"use client";

import { useState } from "react";
import { toggleVendorActive } from "../../actions";
import {
  Store,
  MapPin,
  Clock,
  Building2,
  CheckCircle2,
  XCircle,
  Phone,
} from "lucide-react";
import type { Database } from "@/types/database.types";

type Vendor = Database["public"]["Tables"]["vendors"]["Row"] & {
  profiles?: {
    email: string;
    full_name: string | null;
  } | null;
};

export default function VendorList({
  initialVendors,
}: {
  initialVendors: Vendor[];
}) {
  const [vendors, setVendors] = useState(initialVendors);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  const handleToggle = async (vendor: Vendor) => {
    setVendors((prev) =>
      prev.map((v) =>
        v.id === vendor.id ? { ...v, is_active: !v.is_active } : v
      )
    );
    const res = await toggleVendorActive(vendor.id, vendor.is_active);
    if (res?.error) {
      setVendors(initialVendors);
      alert(res.error);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
          <Store className="w-6 h-6 text-primary" />
          Registered Food Vendors
        </h1>
        <p className="text-xs text-base-content/60 mt-1">
          Review, approve, or suspend vendor storefronts operating on Cyglase Foods.
        </p>
      </div>

      {/* Vendors Table / List */}
      <div className="card bg-base-100 border border-base-300 shadow-xs">
        <div className="card-body p-0">
          {vendors.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full text-xs">
                <thead className="bg-base-200/60 text-base-content/70">
                  <tr>
                    <th>Business Name</th>
                    <th>Location</th>
                    <th>Hours & Kitchen</th>
                    <th>Contact & Payout</th>
                    <th className="text-center">Approval Status</th>
                    <th className="text-right">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.map((v) => (
                    <tr key={v.id} className="hover">
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                            {v.business_name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-base-content">
                              {v.business_name}
                            </div>
                            <div className="text-[11px] text-base-content/60">
                              {v.profiles?.email || "No email"}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="flex items-center gap-1 font-semibold text-base-content">
                          <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>
                            {v.city_area}, {v.city}
                          </span>
                        </div>
                        {v.landmark && (
                          <div className="text-[11px] text-base-content/50 truncate max-w-xs">
                            Near: {v.landmark}
                          </div>
                        )}
                      </td>

                      <td>
                        <div className="flex items-center gap-1 text-[11px]">
                          <Clock className="w-3 h-3 text-base-content/60" />
                          <span>
                            {v.opening_time.slice(0, 5)} - {v.closing_time.slice(0, 5)}
                          </span>
                        </div>
                        <span
                          className={`badge badge-xs font-semibold mt-1 ${
                            v.is_open ? "badge-success text-white" : "badge-ghost"
                          }`}
                        >
                          {v.is_open ? "Kitchen Open" : "Closed"}
                        </span>
                      </td>

                      <td>
                        <div className="flex items-center gap-1 text-xs">
                          <Phone className="w-3 h-3 text-base-content/50" />
                          <span className="font-mono">{v.phone}</span>
                        </div>
                        {v.bank_name && v.account_number && (
                          <div className="text-[11px] text-base-content/60 font-mono mt-0.5">
                            {v.bank_name} • {v.account_number}
                          </div>
                        )}
                      </td>

                      <td className="text-center">
                        <button
                          onClick={() => handleToggle(v)}
                          className={`badge badge-sm font-semibold cursor-pointer transition-transform active:scale-95 ${
                            v.is_active ? "badge-success text-white" : "badge-error text-white"
                          }`}
                        >
                          {v.is_active ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 mr-1 inline" />
                              Approved
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 mr-1 inline" />
                              Suspended
                            </>
                          )}
                        </button>
                      </td>

                      <td className="text-right">
                        <button
                          onClick={() => setSelectedVendor(v)}
                          className="btn btn-ghost btn-xs text-primary font-bold"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center">
              <Store className="w-12 h-12 text-base-content/30 mx-auto mb-3" />
              <h3 className="font-bold text-base text-base-content">
                No food vendors registered yet
              </h3>
              <p className="text-xs text-base-content/60 max-w-sm mx-auto mt-1">
                When restaurants and kitchens complete onboarding, their profile and bank details will appear here for verification.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Vendor Inspect Modal */}
      {selectedVendor && (
        <div className="modal modal-open">
          <div className="modal-box max-w-lg border border-base-300">
            <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
              <Store className="w-5 h-5 text-primary" />
              {selectedVendor.business_name}
            </h3>
            <p className="text-xs text-base-content/60 mb-4">
              Registered by {selectedVendor.profiles?.email}
            </p>

            <div className="flex flex-col gap-4 text-xs">
              <div className="p-3 rounded-xl bg-base-200/60 border border-base-300/40">
                <span className="font-bold uppercase tracking-wider text-base-content/50 text-[10px]">
                  Physical Location
                </span>
                <p className="text-sm font-semibold mt-1">
                  {selectedVendor.address}
                </p>
                <p className="text-base-content/70 mt-0.5">
                  Area: {selectedVendor.city_area}, City: {selectedVendor.city},{" "}
                  {selectedVendor.state}
                </p>
                {selectedVendor.landmark && (
                  <p className="text-primary font-medium mt-1">
                    Landmark: {selectedVendor.landmark}
                  </p>
                )}
              </div>

              <div className="p-3 rounded-xl bg-base-200/60 border border-base-300/40">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="w-4 h-4 text-primary" />
                  <span className="font-bold uppercase tracking-wider text-base-content/50 text-[10px]">
                    Direct Bank Transfer Payout Details
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <span className="text-base-content/60">Bank Name:</span>
                    <p className="font-bold text-sm">
                      {selectedVendor.bank_name || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <span className="text-base-content/60">Account Number:</span>
                    <p className="font-mono font-bold text-sm">
                      {selectedVendor.account_number || "Not provided"}
                    </p>
                  </div>
                </div>
                {selectedVendor.account_name && (
                  <div className="mt-2">
                    <span className="text-base-content/60">Account Name:</span>
                    <p className="font-semibold text-xs">
                      {selectedVendor.account_name}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-base-200/60 border border-base-300/40">
                <div>
                  <span className="font-bold uppercase tracking-wider text-base-content/50 text-[10px]">
                    Platform Status
                  </span>
                  <p className="text-xs font-semibold mt-0.5">
                    {selectedVendor.is_active
                      ? "Vendor is actively approved"
                      : "Vendor is suspended / pending approval"}
                  </p>
                </div>
                <button
                  onClick={() => handleToggle(selectedVendor)}
                  className={`btn btn-sm ${
                    selectedVendor.is_active
                      ? "btn-error text-white"
                      : "btn-success text-white"
                  }`}
                >
                  {selectedVendor.is_active ? "Suspend Vendor" : "Approve Vendor"}
                </button>
              </div>
            </div>

            <div className="modal-action mt-6">
              <button
                onClick={() => setSelectedVendor(null)}
                className="btn btn-ghost btn-sm"
              >
                Close
              </button>
            </div>
          </div>
          <div
            className="modal-backdrop bg-black/40"
            onClick={() => setSelectedVendor(null)}
          ></div>
        </div>
      )}
    </div>
  );
}
