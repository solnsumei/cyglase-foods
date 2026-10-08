"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Store,
  MapPin,
  Clock,
  Search,
  X,
  ChefHat,
  ChevronRight,
  Filter,
  CheckCircle2,
  UtensilsCrossed,
} from "lucide-react";
import CustomerTopNav from "@/components/CustomerTopNav";
import CustomerBottomNav from "@/components/CustomerBottomNav";
import type { Database } from "@/types/database.types";
import { getVendorLiveStatus } from "@/lib/vendorStatus";

type Vendor = Database["public"]["Tables"]["vendors"]["Row"];

interface OutletsClientProps {
  user: any;
  isVendor?: boolean;
  vendors: Vendor[];
  menuItems: { id: string; vendor_id: string }[];
}

export default function OutletsClient({
  user,
  isVendor = false,
  vendors,
  menuItems,
}: OutletsClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState<string>("all");
  const [selectedArea, setSelectedArea] = useState<string>("all");
  const [openOnly, setOpenOnly] = useState<boolean>(false);

  // Extract all distinct states from vendors
  const allStates = useMemo(() => {
    const states = vendors.map((v) => v.state || "Lagos").filter(Boolean);
    return Array.from(new Set(states)).sort();
  }, [vendors]);

  // Extract all distinct city areas from vendors (optionally filtered by selected state)
  const allAreas = useMemo(() => {
    const areas = vendors
      .filter((v) => selectedState === "all" || (v.state || "Lagos") === selectedState)
      .map((v) => v.city_area)
      .filter(Boolean);
    return Array.from(new Set(areas)).sort();
  }, [vendors, selectedState]);

  // Dish count lookup per vendor
  const dishCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of menuItems) {
      counts[item.vendor_id] = (counts[item.vendor_id] || 0) + 1;
    }
    return counts;
  }, [menuItems]);

  // Filter Outlets
  const filteredVendors = useMemo(() => {
    return vendors.filter((vendor) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        vendor.business_name.toLowerCase().includes(q) ||
        (vendor.description && vendor.description.toLowerCase().includes(q)) ||
        vendor.city_area.toLowerCase().includes(q) ||
        (vendor.address && vendor.address.toLowerCase().includes(q));

      const vendorState = vendor.state || "Lagos";
      const matchesState = selectedState === "all" || vendorState === selectedState;

      const matchesArea = selectedArea === "all" || vendor.city_area === selectedArea;

      const vStatus = getVendorLiveStatus(vendor);
      const matchesOpen = !openOnly || vStatus.isAcceptingOrders;

      return matchesQuery && matchesState && matchesArea && matchesOpen;
    });
  }, [vendors, searchQuery, selectedState, selectedArea, openOnly]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedState("all");
    setSelectedArea("all");
    setOpenOnly(false);
  };

  const hasActiveFilters =
    searchQuery !== "" ||
    selectedState !== "all" ||
    selectedArea !== "all" ||
    openOnly;

  return (
    <div className="min-h-screen bg-base-200/40 pb-28 md:pb-16 flex flex-col">
      {/* Top Desktop Navigation Menu */}
      <CustomerTopNav user={user} isVendor={isVendor} />

      {/* Main Container */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 pt-5 flex-1">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
            <Store className="w-4 h-4" />
            <span>Food Vendors & Cloud Kitchens</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-base-content tracking-tight">
            Featured Food Outlets
          </h1>
          <p className="text-xs sm:text-sm text-base-content/65 mt-1">
            Browse registered kitchens and restaurants preparing authentic Nigerian dishes for pickup or delivery.
          </p>
        </div>

        {/* Search Bar - Full Width */}
        <div className="relative mb-4">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search outlets by kitchen name, area, or specialty..."
            className="input input-bordered w-full pl-12 pr-10 rounded-2xl bg-base-100 shadow-xs focus:input-primary h-13 text-sm font-medium border-base-300"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="btn btn-ghost btn-circle btn-xs absolute right-3.5 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Obvious Filters Bar for State, Area, and Status */}
        <div className="bg-base-100 p-4 rounded-2xl border border-base-200 shadow-xs mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-base-content/60 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-primary" />
              Location & Outlet Filters
            </span>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="text-xs font-bold text-primary hover:underline"
              >
                Reset filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Filter 1: State */}
            <div>
              <label className="text-[11px] font-bold text-base-content/70 block mb-1">
                State
              </label>
              <select
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                  setSelectedArea("all"); // Reset area when state changes
                }}
                className="select select-bordered select-sm w-full rounded-xl bg-base-100 font-semibold text-xs border-base-300 shadow-xs focus:bg-base-100"
              >
                <option value="all" className="bg-base-100 text-base-content">
                  All States (Nigeria)
                </option>
                {allStates.map((st) => (
                  <option key={st} value={st} className="bg-base-100 text-base-content">
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter 2: City Area */}
            <div>
              <label className="text-[11px] font-bold text-base-content/70 block mb-1">
                City Area / Neighborhood
              </label>
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="select select-bordered select-sm w-full rounded-xl bg-base-100 font-semibold text-xs border-base-300 shadow-xs focus:bg-base-100"
              >
                <option value="all" className="bg-base-100 text-base-content">
                  All Areas
                </option>
                {allAreas.map((area) => (
                  <option key={area} value={area} className="bg-base-100 text-base-content">
                    {area}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter 3: Open Status Toggle */}
            <div className="flex flex-col justify-end">
              <label className="flex items-center justify-between p-2 rounded-xl bg-base-100 border border-base-300 shadow-xs cursor-pointer h-8.5">
                <span className="text-xs font-bold text-base-content">
                  Open Kitchens Only
                </span>
                <input
                  type="checkbox"
                  checked={openOnly}
                  onChange={(e) => setOpenOnly(e.target.checked)}
                  className="toggle toggle-primary toggle-sm"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold text-base-content/70">
            Showing <span className="text-primary font-black">{filteredVendors.length}</span>{" "}
            {filteredVendors.length === 1 ? "food outlet" : "food outlets"}
          </p>
        </div>

        {/* Outlets Grid - ONLY OUTLETS (NO DISHES) */}
        {filteredVendors.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredVendors.map((vendor, index) => {
              const dishCount = dishCounts[vendor.id] || 0;
              const vendorState = vendor.state || "Lagos";

              return (
                <div
                  key={vendor.id}
                  className="card bg-base-100 border border-base-200/90 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between group rounded-3xl"
                >
                  {/* Outlet Banner Image */}
                  <div className="relative h-36 w-full bg-base-300 overflow-hidden">
                    {vendor.banner_url ? (
                      <Image
                        src={vendor.banner_url}
                        alt={vendor.business_name}
                        fill
                        priority={index < 2}
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-linear-to-r from-primary/15 via-base-200 to-secondary/15 flex items-center justify-center text-primary/30">
                        <Store className="w-14 h-14 stroke-[1.2]" />
                      </div>
                    )}

                    {/* Open/Closed Live Badge */}
                    {(() => {
                      const vStatus = getVendorLiveStatus(vendor);
                      return (
                        <div className="absolute top-3 right-3">
                          <span
                            className={`badge badge-sm text-[10px] font-bold text-white shadow-xs ${
                              vStatus.status === "accepting"
                                ? "badge-success"
                                : vStatus.status === "paused"
                                ? "badge-warning"
                                : "badge-neutral"
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-white mr-1"></span>
                            {vStatus.status === "accepting"
                              ? "Open Now"
                              : vStatus.status === "paused"
                              ? "Paused"
                              : "Closed"}
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Outlet Details */}
                  <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                    <div>
                      {/* Avatar & Title */}
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-base-100 border-2 border-base-200 -mt-10 relative z-10 shrink-0 flex items-center justify-center text-primary overflow-hidden shadow-md">
                          {vendor.logo_url ? (
                            <Image
                              src={vendor.logo_url}
                              alt={vendor.business_name}
                              width={48}
                              height={48}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="w-full h-full bg-primary text-white flex items-center justify-center">
                              <ChefHat className="w-6 h-6" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h2 className="font-black text-base sm:text-lg text-base-content tracking-tight group-hover:text-primary transition-colors truncate">
                            {vendor.business_name}
                          </h2>
                          <div className="flex items-center gap-1 text-xs text-base-content/60 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="truncate font-semibold">
                              {vendor.city_area}, {vendorState}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      {vendor.description && (
                        <p className="text-xs text-base-content/65 line-clamp-2 mt-3 leading-relaxed">
                          {vendor.description}
                        </p>
                      )}

                      {/* Address */}
                      {vendor.address && (
                        <p className="text-[11px] text-base-content/50 line-clamp-1 mt-1.5">
                          {vendor.address}
                        </p>
                      )}
                    </div>

                    {/* Footer Info & Action Button */}
                    <div className="pt-3 border-t border-base-200/80 mt-auto flex items-center justify-between">
                      <div className="flex flex-col text-[11px] text-base-content/60">
                        <div className="flex items-center gap-1 font-semibold text-primary">
                          <UtensilsCrossed className="w-3 h-3" />
                          <span>{dishCount} {dishCount === 1 ? "dish" : "dishes"} available</span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>
                            {vendor.opening_time.slice(0, 5)} - {vendor.closing_time.slice(0, 5)}
                          </span>
                        </div>
                      </div>

                      <Link
                        href={`/store/${vendor.slug}`}
                        className="btn btn-sm btn-primary rounded-xl font-bold text-white shadow-xs gap-1 hover:shadow-md transition-all"
                      >
                        <span>View Menu</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card bg-base-100 border border-base-200 p-8 text-center my-6 flex flex-col items-center max-w-lg mx-auto rounded-3xl">
            <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-4">
              <Store className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-base-content tracking-tight">
              No food outlets found
            </h3>
            <p className="text-xs text-base-content/60 mt-1 max-w-sm">
              We couldn't find any food outlets matching your selected location or search query.
            </p>
            <button
              type="button"
              onClick={handleClearFilters}
              className="btn btn-outline btn-sm btn-primary rounded-xl mt-5 font-bold"
            >
              Reset all filters
            </button>
          </div>
        )}
      </main>

      {/* Customer Mobile Navigation */}
      <CustomerBottomNav isLoggedIn={!!user} />
    </div>
  );
}
