"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  SlidersHorizontal,
  ChevronRight,
  ArrowUpDown,
  UtensilsCrossed,
  ShoppingBag,
  Check,
} from "lucide-react";
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
  categories,
  vendors,
  initialItems,
}: SearchClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Query state initialized from URL search params
  const initialQuery = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || "all";
  const initialArea = searchParams.get("area") || "all";

  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedArea, setSelectedArea] = useState<string>(initialArea);
  const [openOnly, setOpenOnly] = useState<boolean>(false);
  const [priceRange, setPriceRange] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recommended");
  const [activeTab, setActiveTab] = useState<"dishes" | "kitchens">("dishes");
  const [showFiltersModal, setShowFiltersModal] = useState<boolean>(false);

  // Sync state if URL changes
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

  // Distinct areas from vendors
  const allAreas = useMemo(() => {
    const areas = vendors.map((v) => v.city_area).filter(Boolean);
    return Array.from(new Set(areas)).sort();
  }, [vendors]);

  // Filter Dishes
  const filteredDishes = useMemo(() => {
    return initialItems.filter((item) => {
      // 1. Text search
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.vendors?.business_name &&
          item.vendors.business_name.toLowerCase().includes(q));

      // 2. Category
      const matchesCategory =
        selectedCategory === "all" ||
        item.categories?.slug === selectedCategory ||
        item.category_id === selectedCategory;

      // 3. Area
      const matchesArea =
        selectedArea === "all" || item.vendors?.city_area === selectedArea;

      // 4. Open status
      const matchesOpen = !openOnly || item.vendors?.is_open === true;

      // 5. Price range
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
        matchesArea &&
        matchesOpen &&
        matchesPrice
      );
    }).sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      if (sortBy === "name-asc") return a.name.localeCompare(b.name);
      return 0; // recommended / default
    });
  }, [initialItems, query, selectedCategory, selectedArea, openOnly, priceRange, sortBy]);

  // Filter Kitchens
  const filteredKitchens = useMemo(() => {
    return vendors.filter((vendor) => {
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        vendor.business_name.toLowerCase().includes(q) ||
        (vendor.description && vendor.description.toLowerCase().includes(q)) ||
        vendor.city_area.toLowerCase().includes(q);

      const matchesArea =
        selectedArea === "all" || vendor.city_area === selectedArea;

      const matchesOpen = !openOnly || vendor.is_open === true;

      return matchesQuery && matchesArea && matchesOpen;
    });
  }, [vendors, query, selectedArea, openOnly]);

  const handleClearSearch = () => {
    setQuery("");
  };

  const handleSelectPopularSearch = (term: string) => {
    setQuery(term);
  };

  const activeFiltersCount =
    (selectedCategory !== "all" ? 1 : 0) +
    (selectedArea !== "all" ? 1 : 0) +
    (openOnly ? 1 : 0) +
    (priceRange !== "all" ? 1 : 0);

  const resetAllFilters = () => {
    setSelectedCategory("all");
    setSelectedArea("all");
    setOpenOnly(false);
    setPriceRange("all");
    setSortBy("recommended");
    setShowFiltersModal(false);
  };

  return (
    <div className="min-h-screen bg-base-200/40 pb-28 md:pb-16">
      {/* Top Search Sticky Bar */}
      <header className="sticky top-0 z-30 bg-base-100/95 backdrop-blur-md border-b border-base-200 px-4 py-3 sm:px-6 shadow-xs">
        <div className="max-w-4xl mx-auto flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="w-10 h-10 rounded-2xl bg-base-200 hover:bg-base-300 flex items-center justify-center shrink-0 transition-colors"
              title="Return home"
            >
              <ChefHat className="w-5 h-5 text-primary" />
            </Link>

            {/* Input box */}
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search food, dishes, ingredients, or kitchens..."
                className="input input-bordered w-full pl-11 pr-10 rounded-2xl bg-base-200/60 focus:bg-base-100 text-sm font-medium border-base-300"
                autoFocus={!initialQuery}
              />
              {query && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-base-300 hover:bg-base-content/20 flex items-center justify-center transition-colors text-base-content/60"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Modal Trigger */}
            <button
              type="button"
              onClick={() => setShowFiltersModal(true)}
              className={`btn btn-circle btn-sm sm:btn-md shrink-0 ${
                activeFiltersCount > 0
                  ? "btn-primary text-white"
                  : "btn-ghost bg-base-200 text-base-content"
              }`}
              title="Filters"
            >
              <div className="relative">
                <SlidersHorizontal className="w-4 h-4" />
                {activeFiltersCount > 0 && (
                  <span className="badge badge-secondary badge-xs absolute -top-2 -right-2 text-[9px] font-bold h-4 w-4 p-0">
                    {activeFiltersCount}
                  </span>
                )}
              </div>
            </button>
          </div>

          {/* Quick Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`btn btn-xs rounded-full px-3 shrink-0 font-bold transition-all ${
                selectedCategory === "all"
                  ? "btn-primary text-white shadow-xs"
                  : "btn-ghost bg-base-200/80 text-base-content/70 hover:bg-base-200"
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
                  className={`btn btn-xs rounded-full px-3 shrink-0 font-bold transition-all ${
                    isSelected
                      ? "btn-primary text-white shadow-xs"
                      : "btn-ghost bg-base-200/80 text-base-content/70 hover:bg-base-200"
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 pt-4 sm:px-6">
        {/* Results Tabs & Sort Header */}
        <div className="flex items-center justify-between gap-2 border-b border-base-300 pb-3 mb-4">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-base-200 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab("dishes")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "dishes"
                  ? "bg-base-100 text-primary shadow-xs"
                  : "text-base-content/60 hover:text-base-content"
              }`}
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>Dishes</span>
              <span className="badge badge-sm badge-ghost text-[10px] font-black opacity-80">
                {filteredDishes.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("kitchens")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "kitchens"
                  ? "bg-base-100 text-primary shadow-xs"
                  : "text-base-content/60 hover:text-base-content"
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Places & Outlets</span>
              <span className="badge badge-sm badge-ghost text-[10px] font-black opacity-80">
                {filteredKitchens.length}
              </span>
            </button>
          </div>

          {/* Quick Sort Dropdown */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-base-content/50 hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="select select-xs select-bordered rounded-xl bg-base-100 text-xs font-semibold focus:outline-none"
            >
              <option value="recommended">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name-asc">Name: A to Z</option>
            </select>
          </div>
        </div>

        {/* Active Filter Chips Bar */}
        {(activeFiltersCount > 0 || query) && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-xs font-semibold text-base-content/50">Active:</span>
            {query && (
              <span className="badge badge-sm bg-base-100 border-base-300 gap-1 text-xs py-2.5">
                "{query}"
                <X
                  className="w-3 h-3 cursor-pointer hover:text-error"
                  onClick={handleClearSearch}
                />
              </span>
            )}
            {selectedCategory !== "all" && (
              <span className="badge badge-sm badge-primary text-white gap-1 text-xs py-2.5">
                {categories.find((c) => c.slug === selectedCategory)?.name || selectedCategory}
                <X
                  className="w-3 h-3 cursor-pointer hover:opacity-80"
                  onClick={() => setSelectedCategory("all")}
                />
              </span>
            )}
            {selectedArea !== "all" && (
              <span className="badge badge-sm bg-base-100 border-base-300 gap-1 text-xs py-2.5">
                📍 {selectedArea}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-error"
                  onClick={() => setSelectedArea("all")}
                />
              </span>
            )}
            {openOnly && (
              <span className="badge badge-sm badge-success text-white gap-1 text-xs py-2.5">
                Open Kitchens Only
                <X
                  className="w-3 h-3 cursor-pointer hover:opacity-80"
                  onClick={() => setOpenOnly(false)}
                />
              </span>
            )}
            {priceRange !== "all" && (
              <span className="badge badge-sm bg-base-100 border-base-300 gap-1 text-xs py-2.5">
                {priceRange === "under-2500" && "< ₦2,500"}
                {priceRange === "2500-6000" && "₦2,500 - ₦6,000"}
                {priceRange === "above-6000" && "> ₦6,000"}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-error"
                  onClick={() => setPriceRange("all")}
                />
              </span>
            )}
            <button
              onClick={resetAllFilters}
              className="text-xs text-primary font-bold hover:underline ml-1"
            >
              Reset all
            </button>
          </div>
        )}

        {/* TAB 1: DISHES */}
        {activeTab === "dishes" && (
          <div>
            {filteredDishes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDishes.map((dish) => {
                  const vendorSlug = dish.vendors?.slug || "";
                  const isOpen = dish.vendors?.is_open ?? true;

                  return (
                    <div
                      key={dish.id}
                      className="card bg-base-100 border border-base-200/80 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between group"
                    >
                      <div className="relative aspect-4/3 w-full bg-base-200 overflow-hidden">
                        {dish.image_url ? (
                          <Image
                            src={dish.image_url}
                            alt={dish.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-base-content/30 gap-2 bg-gradient-to-br from-base-200 to-base-300">
                            <UtensilsCrossed className="w-10 h-10 stroke-[1.5]" />
                            <span className="text-xs font-semibold">Nigerian Dish</span>
                          </div>
                        )}

                        {/* Category & Status Overlay */}
                        <div className="absolute top-2 left-2 flex items-center gap-1.5">
                          {dish.categories?.name && (
                            <span className="badge badge-sm bg-base-100/90 backdrop-blur-md text-[10px] font-bold text-base-content shadow-xs">
                              {dish.categories.name}
                            </span>
                          )}
                        </div>

                        <div className="absolute top-2 right-2">
                          <span
                            className={`badge badge-sm text-[10px] font-bold text-white shadow-xs ${
                              isOpen ? "badge-success" : "badge-neutral"
                            }`}
                          >
                            {isOpen ? "Kitchen Open" : "Closed"}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-bold text-base text-base-content tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
                              {dish.name}
                            </h3>
                          </div>

                          {dish.description && (
                            <p className="text-xs text-base-content/60 line-clamp-2 mt-1 leading-relaxed">
                              {dish.description}
                            </p>
                          )}

                          {dish.vendors?.business_name && (
                            <div className="flex items-center gap-1.5 mt-2.5 text-xs text-base-content/70">
                              <Store className="w-3.5 h-3.5 text-primary shrink-0" />
                              <span className="font-semibold line-clamp-1">
                                {dish.vendors.business_name}
                              </span>
                              {dish.vendors.city_area && (
                                <span className="text-base-content/40 shrink-0">
                                  • 📍 {dish.vendors.city_area}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-base-200/60 mt-auto">
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
                              className="btn btn-sm btn-primary text-white rounded-xl font-bold shadow-xs hover:shadow-md transition-all gap-1"
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
              <div className="card bg-base-100 border border-base-200 p-8 text-center my-6 flex flex-col items-center max-w-lg mx-auto">
                <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <UtensilsCrossed className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-base-content tracking-tight">
                  No dishes found
                </h3>
                <p className="text-xs text-base-content/60 mt-1 max-w-sm">
                  We couldn't find any dishes matching your search or filters. Try adjusting your
                  search or clearing active filters.
                </p>

                <div className="mt-5 w-full">
                  <span className="text-xs font-bold text-base-content/50 uppercase tracking-wider block mb-2">
                    Popular Nigerian Cuisines
                  </span>
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {POPULAR_SEARCHES.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => handleSelectPopularSearch(term)}
                        className="btn btn-xs btn-ghost bg-base-200 hover:bg-primary hover:text-white rounded-full transition-all"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="btn btn-outline btn-sm btn-primary rounded-xl mt-6 font-bold"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: KITCHENS */}
        {activeTab === "kitchens" && (
          <div>
            {filteredKitchens.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredKitchens.map((vendor) => {
                  const kitchenDishesCount = initialItems.filter(
                    (item) => item.vendor_id === vendor.id
                  ).length;

                  return (
                    <Link
                      key={vendor.id}
                      href={`/store/${vendor.slug}`}
                      className="card bg-base-100 border border-base-200/80 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden group flex flex-col justify-between"
                    >
                      {/* Kitchen Banner / Header */}
                      <div className="relative h-28 w-full bg-base-300 overflow-hidden">
                        {vendor.banner_url ? (
                          <Image
                            src={vendor.banner_url}
                            alt={vendor.business_name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                        ) : (
                          <div className="w-full h-full bg-linear-to-r from-primary/20 to-secondary/20 flex items-center justify-center text-primary/30">
                            <Store className="w-12 h-12 stroke-[1.2]" />
                          </div>
                        )}

                        <div className="absolute top-2 right-2">
                          <span
                            className={`badge badge-sm text-[10px] font-bold text-white shadow-xs ${
                              vendor.is_open ? "badge-success" : "badge-neutral"
                            }`}
                          >
                            {vendor.is_open ? "Open Now" : "Closed"}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-base-200 border border-base-300 -mt-8 relative z-10 shrink-0 flex items-center justify-center text-primary overflow-hidden shadow-xs">
                              {vendor.logo_url ? (
                                <Image
                                  src={vendor.logo_url}
                                  alt={vendor.business_name}
                                  width={40}
                                  height={40}
                                  className="object-cover w-full h-full"
                                />
                              ) : (
                                <ChefHat className="w-5 h-5" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-black text-base text-base-content tracking-tight group-hover:text-primary transition-colors truncate">
                                {vendor.business_name}
                              </h3>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 mt-2 text-xs text-base-content/60">
                            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="truncate">{vendor.city_area}</span>
                          </div>

                          {vendor.description && (
                            <p className="text-xs text-base-content/60 line-clamp-2 mt-2 leading-relaxed">
                              {vendor.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-base-200/60 mt-auto">
                          <span className="text-xs font-semibold text-base-content/50">
                            {kitchenDishesCount} {kitchenDishesCount === 1 ? "dish" : "dishes"} available
                          </span>

                          <span className="text-xs font-bold text-primary flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                            <span>Visit Kitchen</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="card bg-base-100 border border-base-200 p-8 text-center my-6 flex flex-col items-center max-w-lg mx-auto">
                <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <Store className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-base-content tracking-tight">
                  No kitchens found
                </h3>
                <p className="text-xs text-base-content/60 mt-1 max-w-sm">
                  We couldn't find any food vendors matching your search criteria. Try selecting "All
                  Areas" or clearing your query.
                </p>
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="btn btn-outline btn-sm btn-primary rounded-xl mt-5 font-bold"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Filter Modal Sheet */}
      {showFiltersModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
          <div className="bg-base-100 w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 max-h-[85vh] overflow-y-auto flex flex-col gap-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-base-200 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-primary" />
                <h3 className="font-black text-lg text-base-content">Search Filters</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFiltersModal(false)}
                className="btn btn-sm btn-circle btn-ghost"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Category Filter */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-base-content/60 block mb-2">
                Food Category
              </label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("all")}
                  className={`btn btn-xs rounded-xl font-bold ${
                    selectedCategory === "all" ? "btn-primary text-white" : "btn-ghost bg-base-200"
                  }`}
                >
                  All Categories
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCategory(c.slug)}
                    className={`btn btn-xs rounded-xl font-bold ${
                      selectedCategory === c.slug
                        ? "btn-primary text-white"
                        : "btn-ghost bg-base-200"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Area Filter */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-base-content/60 block mb-2">
                Area / City
              </label>
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="select select-bordered select-sm w-full rounded-xl bg-base-200 font-semibold"
              >
                <option value="all">All Locations (Nigeria)</option>
                {allAreas.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range Filter */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-base-content/60 block mb-2">
                Price Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "all", label: "Any Price" },
                  { id: "under-2500", label: "Under ₦2,500" },
                  { id: "2500-6000", label: "₦2,500 - ₦6,000" },
                  { id: "above-6000", label: "Over ₦6,000" },
                ].map((range) => (
                  <button
                    key={range.id}
                    type="button"
                    onClick={() => setPriceRange(range.id)}
                    className={`btn btn-xs rounded-xl font-bold ${
                      priceRange === range.id
                        ? "btn-primary text-white"
                        : "btn-ghost bg-base-200 text-base-content/70"
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Open Only Switch */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-base-200/60">
              <div>
                <span className="font-bold text-sm block">Open Kitchens Only</span>
                <span className="text-xs text-base-content/50">
                  Only show places taking orders right now
                </span>
              </div>
              <input
                type="checkbox"
                checked={openOnly}
                onChange={(e) => setOpenOnly(e.target.checked)}
                className="toggle toggle-primary toggle-sm"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-base-200 mt-2">
              <button
                type="button"
                onClick={resetAllFilters}
                className="btn btn-ghost btn-sm flex-1 rounded-xl font-bold"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setShowFiltersModal(false)}
                className="btn btn-primary btn-sm flex-1 text-white rounded-xl font-bold"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Mobile Navigation */}
      <CustomerBottomNav isLoggedIn={!!user} />
    </div>
  );
}
