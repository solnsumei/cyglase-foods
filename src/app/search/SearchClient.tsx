"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  X,
  Store,
  MapPin,
  Clock,
  Sparkles,
  ArrowRight,
  Flame,
  ChefHat,
  ChevronRight,
  UtensilsCrossed,
  ShoppingBag,
  Filter,
} from "lucide-react";
import CustomerTopNav from "@/components/CustomerTopNav";
import CustomerBottomNav from "@/components/CustomerBottomNav";
import type { Database } from "@/types/database.types";

type Vendor = Database["public"]["Tables"]["vendors"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];
type MenuItem = Database["public"]["Tables"]["menu_items"]["Row"] & {
  vendors?: {
    id: string;
    business_name: string;
    slug: string;
    city_area: string;
    city?: string | null;
    state?: string | null;
    is_open: boolean;
    logo_url?: string | null;
    banner_url?: string | null;
  } | null;
  categories?: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

interface SearchClientProps {
  user: any;
  isVendor?: boolean;
  categories: Category[];
  vendors: Vendor[];
  initialItems: MenuItem[];
}

const POPULAR_SEARCHES = [
  "Party Jollof",
  "Egusi & Pounded Yam",
  "Spicy Beef Suya",
  "Zobo Juice",
  "Goat Meat Pepper Soup",
  "Fried Rice & Chicken",
  "Puff-Puff",
  "Amala & Ewedu",
];

export default function SearchClient({
  user,
  isVendor = false,
  categories,
  vendors,
  initialItems,
}: SearchClientProps) {
  const searchParams = useSearchParams();

  // Query state initialized from URL search params
  const initialQuery = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || "all";
  const initialArea = searchParams.get("area") || "all";
  const initialState = searchParams.get("state") || "all";

  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedState, setSelectedState] = useState<string>(initialState);
  const [selectedArea, setSelectedArea] = useState<string>(initialArea);
  const [openOnly, setOpenOnly] = useState<boolean>(false);
  const [priceRange, setPriceRange] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recommended");

  // Sync state if URL search params change
  useEffect(() => {
    const q = searchParams.get("q");
    if (q !== null && q !== query) {
      setQuery(q);
    }
    const cat = searchParams.get("category");
    if (cat !== null) {
      setSelectedCategory(cat);
    }
  }, [searchParams]);

  // Extract distinct states from vendors
  const allStates = useMemo(() => {
    const states = vendors.map((v) => v.state || "Lagos").filter(Boolean);
    return Array.from(new Set(states)).sort();
  }, [vendors]);

  // Extract distinct areas from vendors (optionally filtered by selected state)
  const allAreas = useMemo(() => {
    const areas = vendors
      .filter((v) => selectedState === "all" || (v.state || "Lagos") === selectedState)
      .map((v) => v.city_area)
      .filter(Boolean);
    return Array.from(new Set(areas)).sort();
  }, [vendors, selectedState]);

  // Filter Dishes
  const filteredDishes = useMemo(() => {
    return initialItems
      .filter((item) => {
        // 1. Full text search
        const q = query.trim().toLowerCase();
        const matchesQuery =
          !q ||
          item.name.toLowerCase().includes(q) ||
          (item.description && item.description.toLowerCase().includes(q)) ||
          (item.vendors?.business_name &&
            item.vendors.business_name.toLowerCase().includes(q));

        // 2. Category filter
        const matchesCategory =
          selectedCategory === "all" ||
          item.categories?.slug === selectedCategory ||
          item.category_id === selectedCategory;

        // 3. State filter
        const itemState = item.vendors?.state || "Lagos";
        const matchesState = selectedState === "all" || itemState === selectedState;

        // 4. Area filter
        const matchesArea =
          selectedArea === "all" || item.vendors?.city_area === selectedArea;

        // 5. Open status filter
        const matchesOpen = !openOnly || item.vendors?.is_open === true;

        // 6. Price range
        let matchesPrice = true;
        if (priceRange === "under-2500") {
          matchesPrice = item.price < 2500;
        } else if (priceRange === "2500-6000") {
          matchesPrice = item.price >= 2500 && item.price <= 6000;
        } else if (priceRange === "above-6000") {
          matchesPrice = item.price > 6000;
        }

        return (
          matchesQuery &&
          matchesCategory &&
          matchesState &&
          matchesArea &&
          matchesOpen &&
          matchesPrice
        );
      })
      .sort((a, b) => {
        if (sortBy === "price-low") return a.price - b.price;
        if (sortBy === "price-high") return b.price - a.price;
        if (sortBy === "name-asc") return a.name.localeCompare(b.name);
        return 0; // default featured
      });
  }, [initialItems, query, selectedCategory, selectedState, selectedArea, openOnly, priceRange, sortBy]);

  const handleClearFilters = () => {
    setQuery("");
    setSelectedCategory("all");
    setSelectedState("all");
    setSelectedArea("all");
    setOpenOnly(false);
    setPriceRange("all");
    setSortBy("recommended");
  };

  const hasActiveFilters =
    query !== "" ||
    selectedCategory !== "all" ||
    selectedState !== "all" ||
    selectedArea !== "all" ||
    openOnly ||
    priceRange !== "all";

  return (
    <div className="min-h-screen bg-base-200/40 pb-28 md:pb-16 flex flex-col">
      {/* Top Menu Bar on Desktop */}
      <CustomerTopNav user={user} isVendor={isVendor} />

      {/* Main Container */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 pt-5 flex-1">
        {/* Header Title */}
        <div className="mb-4">
          <h1 className="text-2xl sm:text-3xl font-black text-base-content tracking-tight">
            Search Food & Dishes
          </h1>
          <p className="text-xs sm:text-sm text-base-content/65 mt-1">
            Search Nigerian meals, swallows, grills, drinks, and snacks across local kitchens.
          </p>
        </div>

        {/* 1. Full-Width Search Bar */}
        <div className="relative mb-5 w-full">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search party jollof, egusi soup, pepper soup, suya, drinks, snacks..."
            className="input input-bordered w-full pl-12 pr-10 rounded-2xl bg-base-100 shadow-xs focus:input-primary h-14 text-sm sm:text-base font-medium border-base-300"
            autoFocus={!initialQuery}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="btn btn-ghost btn-circle btn-xs absolute right-3.5 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 2. Obvious Location & Status Filters */}
        <div className="bg-base-100 p-4 sm:p-5 rounded-2xl border border-base-200 shadow-xs mb-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-base-content/60 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-primary" />
              Location & Kitchen Filters
            </span>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="text-xs font-bold text-primary hover:underline"
              >
                Reset all filters
              </button>
            )}
          </div>

          {/* Grid of Location Dropdowns + Open Kitchens Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Filter: State */}
            <div>
              <label className="text-[11px] font-bold text-base-content/70 block mb-1">
                State
              </label>
              <select
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                  setSelectedArea("all");
                }}
                className="select select-bordered select-sm w-full rounded-xl bg-base-200/60 font-semibold text-xs"
              >
                <option value="all">All States (Nigeria)</option>
                {allStates.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter: City Area */}
            <div>
              <label className="text-[11px] font-bold text-base-content/70 block mb-1">
                City Area / Neighborhood
              </label>
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="select select-bordered select-sm w-full rounded-xl bg-base-200/60 font-semibold text-xs"
              >
                <option value="all">All Areas</option>
                {allAreas.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter: Open Only Toggle */}
            <div className="flex flex-col justify-end">
              <label className="flex items-center justify-between p-2 rounded-xl bg-base-200/60 border border-base-200 cursor-pointer h-8.5">
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

          {/* Price Range & Sort Bar */}
          <div className="pt-2 border-t border-base-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-bold text-base-content/60 mr-1">Price:</span>
              {[
                { id: "all", label: "Any" },
                { id: "under-2500", label: "< ₦2,500" },
                { id: "2500-6000", label: "₦2,500 - ₦6,000" },
                { id: "above-6000", label: "> ₦6,000" },
              ].map((range) => (
                <button
                  key={range.id}
                  type="button"
                  onClick={() => setPriceRange(range.id)}
                  className={`btn btn-xs rounded-xl font-bold transition-all ${
                    priceRange === range.id
                      ? "btn-primary text-white shadow-xs"
                      : "btn-ghost bg-base-200/80 text-base-content/70 hover:bg-base-200"
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <span className="font-bold text-base-content/60">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="select select-xs select-bordered rounded-xl bg-base-100 text-xs font-bold"
              >
                <option value="recommended">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. Category Horizontal Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-4">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`btn btn-sm rounded-2xl px-4 shrink-0 font-bold transition-all ${
              selectedCategory === "all"
                ? "btn-primary text-white shadow-sm"
                : "btn-ghost bg-base-100 text-base-content/70 hover:bg-base-200 border border-base-200"
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(isSelected ? "all" : cat.slug)}
                className={`btn btn-sm rounded-2xl px-4 shrink-0 font-bold transition-all ${
                  isSelected
                    ? "btn-primary text-white shadow-sm"
                    : "btn-ghost bg-base-100 text-base-content/70 hover:bg-base-200 border border-base-200"
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Results Counter & Link to Outlets Page */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold text-base-content/70">
            Found <span className="text-primary font-black">{filteredDishes.length}</span>{" "}
            {filteredDishes.length === 1 ? "dish" : "dishes"}
          </p>

          <Link
            href="/outlets"
            className="text-xs font-bold text-secondary hover:underline flex items-center gap-1"
          >
            <Store className="w-3.5 h-3.5" />
            <span>Looking for food outlets? Browse Outlets</span>
          </Link>
        </div>

        {/* Dishes Grid */}
        {filteredDishes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDishes.map((dish, index) => {
              const vendorSlug = dish.vendors?.slug || "";
              const isOpen = dish.vendors?.is_open ?? true;
              const vendorState = dish.vendors?.state || "Lagos";

              return (
                <div
                  key={dish.id}
                  className="card bg-base-100 border border-base-200/90 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between group rounded-3xl"
                >
                  {/* Dish Image */}
                  <div className="relative aspect-4/3 w-full bg-base-200 overflow-hidden">
                    {dish.image_url ? (
                      <Image
                        src={dish.image_url}
                        alt={dish.name}
                        fill
                        priority={index < 2}
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-base-content/30 gap-2 bg-gradient-to-br from-base-200 to-base-300">
                        <UtensilsCrossed className="w-10 h-10 stroke-[1.5]" />
                        <span className="text-xs font-semibold">Nigerian Dish</span>
                      </div>
                    )}

                    {/* Category Overlay */}
                    <div className="absolute top-3 left-3">
                      {dish.categories?.name && (
                        <span className="badge badge-sm bg-base-100/90 backdrop-blur-md text-[10px] font-bold text-base-content shadow-xs">
                          {dish.categories.name}
                        </span>
                      )}
                    </div>

                    {/* Kitchen Status Overlay */}
                    <div className="absolute top-3 right-3">
                      <span
                        className={`badge badge-sm text-[10px] font-bold text-white shadow-xs ${
                          isOpen ? "badge-success" : "badge-neutral"
                        }`}
                      >
                        {isOpen ? "Kitchen Open" : "Closed"}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3">
                    <div>
                      <h2 className="font-bold text-base text-base-content tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
                        {dish.name}
                      </h2>

                      {dish.description && (
                        <p className="text-xs text-base-content/60 line-clamp-2 mt-1 leading-relaxed">
                          {dish.description}
                        </p>
                      )}

                      {/* Outlet Info */}
                      {dish.vendors?.business_name && (
                        <div className="flex items-center gap-1.5 mt-2.5 text-xs text-base-content/70">
                          <Store className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="font-semibold line-clamp-1">
                            {dish.vendors.business_name}
                          </span>
                          {dish.vendors.city_area && (
                            <span className="text-base-content/40 shrink-0">
                              • 📍 {dish.vendors.city_area}, {vendorState}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Footer: Price & Order Action */}
                    <div className="flex items-center justify-between pt-3 border-t border-base-200/80 mt-auto">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-base-content/40 block leading-none">
                          Price
                        </span>
                        <span className="text-lg font-black text-primary">
                          ₦{dish.price.toLocaleString()}
                        </span>
                      </div>

                      {vendorSlug ? (
                        <Link
                          href={`/store/${vendorSlug}?highlight=${dish.id}`}
                          className="btn btn-sm btn-primary text-white rounded-xl font-bold shadow-xs hover:shadow-md transition-all gap-1 px-4"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Order</span>
                        </Link>
                      ) : (
                        <button
                          disabled
                          className="btn btn-sm btn-disabled rounded-xl text-xs"
                        >
                          Unavailable
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card bg-base-100 border border-base-200 p-8 text-center my-6 flex flex-col items-center max-w-lg mx-auto rounded-3xl">
            <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-4">
              <UtensilsCrossed className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-base-content tracking-tight">
              No dishes found
            </h3>
            <p className="text-xs text-base-content/60 mt-1 max-w-sm">
              We couldn't find any dishes matching your search query or location filters. Try adjusting your
              filters.
            </p>

            {/* Popular Searches */}
            <div className="mt-5 w-full">
              <span className="text-xs font-bold text-base-content/50 uppercase tracking-wider block mb-2">
                Popular Nigerian Dishes
              </span>
              <div className="flex flex-wrap justify-center gap-1.5">
                {POPULAR_SEARCHES.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => setQuery(term)}
                    className="btn btn-xs btn-ghost bg-base-200 hover:bg-primary hover:text-white rounded-full transition-all"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleClearFilters}
              className="btn btn-outline btn-sm btn-primary rounded-xl mt-6 font-bold"
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
