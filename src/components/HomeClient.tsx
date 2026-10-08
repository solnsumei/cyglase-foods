"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Search,
  MapPin,
  UtensilsCrossed,
  Store,
  Clock,
  Sparkles,
  ArrowRight,
  ShoppingBag,
  Flame,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  X,
  User,
  LogOut,
  Filter,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import type { Database } from "@/types/database.types";
import type { StateRow } from "@/lib/locations";
import CustomerBottomNav from "./CustomerBottomNav";
import CustomerTopNav from "./CustomerTopNav";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Vendor = Database["public"]["Tables"]["vendors"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];
type MenuItem = Database["public"]["Tables"]["menu_items"]["Row"] & {
  vendors?: {
    id?: string;
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
    id?: string;
    name: string;
    slug: string;
  } | null;
};

interface Props {
  user: any;
  isVendor?: boolean;
  categories: Category[];
  vendors: Vendor[];
  initialItems: MenuItem[];
  locationStates?: StateRow[];
  initialQuery?: string;
  initialCategory?: string;
  initialState?: string;
  initialArea?: string;
}

const CUISINE_SLIDES = [
  {
    title: "Smoky Party Jollof & Dodo",
    tagline: "Authentic Nigerian wood-fire flavors with tender grilled chicken",
    image: "/images/cuisines/jollof_party_dish.jpg",
    categorySlug: "meals",
  },
  {
    title: "Rich Egusi & Smooth Pounded Yam",
    tagline: "Piping hot soup packed with stockfish, meat & leafy greens",
    image: "/images/cuisines/egusi_pounded_yam.jpg",
    categorySlug: "swallows",
  },
  {
    title: "Sizzling Street Suya & Peppers",
    tagline: "Thinly-sliced beef skewers spiced with fiery Kano yaji",
    image: "/images/cuisines/nigerian_suya_meat.jpg",
    categorySlug: "proteins",
  },
  {
    title: "Cold Zobo with Ginger & Mint",
    tagline: "Naturally sweetened hibiscus juice to quench Lagos heat",
    image: "/images/cuisines/nigerian_zobo_drink.jpg",
    categorySlug: "drinks",
  },
  {
    title: "Warm Golden Puff-Puff & Meat Pies",
    tagline: "Crisp, doughy delights freshly fried every morning",
    image: "/images/cuisines/puff_puff_meatpie.jpg",
    categorySlug: "desserts",
  },
];

export default function HomeClient({
  user,
  isVendor = false,
  categories,
  vendors,
  initialItems,
  locationStates = [],
  initialQuery = "",
  initialCategory = "all",
  initialState = "all",
  initialArea = "all",
}: Props) {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Search & Filter State
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedState, setSelectedState] = useState<string>(initialState);
  const [selectedArea, setSelectedArea] = useState<string>(initialArea);
  const [openOnly, setOpenOnly] = useState<boolean>(false);
  const [priceRange, setPriceRange] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recommended");
  const [showFilters, setShowFilters] = useState<boolean>(
    initialState !== "all" || initialArea !== "all"
  );
  const [activeSlide, setActiveSlide] = useState(0);

  // Pagination State for Search Results & Home Dishes
  const SEARCH_DISHES_PER_PAGE = 12;
  const [searchPage, setSearchPage] = useState(1);
  const [homeDishesCount, setHomeDishesCount] = useState(12);

  // Reset search page whenever filters change
  useEffect(() => {
    setSearchPage(1);
  }, [query, selectedCategory, selectedState, selectedArea, openOnly, priceRange, sortBy]);

  // Listen for hash #search or ?focus=search to auto-focus
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.location.hash === "#search" || window.location.search.includes("focus=search")) {
        searchInputRef.current?.focus();
      }
    }
  }, []);

  // Compute available states: only include states where at least one vendor exists
  const allStates = useMemo(() => {
    const vendorStateNames = vendors
      .map((v) => v.state)
      .filter((s): s is string => Boolean(s && s.trim()));
    return Array.from(new Set(vendorStateNames)).sort();
  }, [vendors]);

  // Compute available cities/areas for the selected state where vendors exist
  const availableAreas = useMemo(() => {
    const areasFromVendors = vendors
      .filter(
        (v) =>
          selectedState === "all" ||
          (v.state || "Lagos").toLowerCase() === selectedState.toLowerCase()
      )
      .map((v) => v.city_area)
      .filter(Boolean);

    return Array.from(new Set(areasFromVendors)).sort();
  }, [vendors, selectedState]);


  // Filter Dishes
  const filteredDishes = useMemo(() => {
    return initialItems
      .filter((item) => {
        // 1. Text Query
        const q = query.trim().toLowerCase();
        const matchesQuery =
          !q ||
          item.name.toLowerCase().includes(q) ||
          (item.description && item.description.toLowerCase().includes(q)) ||
          (item.vendors?.business_name &&
            item.vendors.business_name.toLowerCase().includes(q)) ||
          (item.vendors?.city_area &&
            item.vendors.city_area.toLowerCase().includes(q));

        // 2. Category
        const matchesCategory =
          selectedCategory === "all" ||
          item.category_id === selectedCategory ||
          item.categories?.slug === selectedCategory ||
          item.categories?.id === selectedCategory;

        // 3. State
        const itemState = item.vendors?.state || "Lagos";
        const matchesState = selectedState === "all" || itemState === selectedState;

        // 4. Area
        const matchesArea =
          selectedArea === "all" ||
          selectedArea === "All Areas" ||
          item.vendors?.city_area?.toLowerCase() === selectedArea.toLowerCase();

        // 5. Open status
        const matchesOpen = !openOnly || item.vendors?.is_open === true;

        // 6. Price range
        let matchesPrice = true;
        if (priceRange === "under-2500") {
          matchesPrice = Number(item.price) < 2500;
        } else if (priceRange === "2500-6000") {
          matchesPrice = Number(item.price) >= 2500 && Number(item.price) <= 6000;
        } else if (priceRange === "above-6000") {
          matchesPrice = Number(item.price) > 6000;
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
        if (sortBy === "price-low") return Number(a.price) - Number(b.price);
        if (sortBy === "price-high") return Number(b.price) - Number(a.price);
        if (sortBy === "name-asc") return a.name.localeCompare(b.name);
        return 0;
      });
  }, [
    initialItems,
    query,
    selectedCategory,
    selectedState,
    selectedArea,
    openOnly,
    priceRange,
    sortBy,
  ]);

  const totalSearchPages = Math.ceil(filteredDishes.length / SEARCH_DISHES_PER_PAGE) || 1;
  const paginatedSearchDishes = useMemo(() => {
    return filteredDishes.slice(
      (searchPage - 1) * SEARCH_DISHES_PER_PAGE,
      searchPage * SEARCH_DISHES_PER_PAGE
    );
  }, [filteredDishes, searchPage]);

  // Filter Vendors
  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        v.business_name.toLowerCase().includes(q) ||
        v.city_area.toLowerCase().includes(q) ||
        (v.city && v.city.toLowerCase().includes(q));

      const vState = v.state || "Lagos";
      const matchesState = selectedState === "all" || vState === selectedState;

      const matchesArea =
        selectedArea === "all" ||
        selectedArea === "All Areas" ||
        v.city_area.toLowerCase() === selectedArea.toLowerCase();

      const matchesOpen = !openOnly || v.is_open === true;

      return matchesQuery && matchesState && matchesArea && matchesOpen;
    });
  }, [vendors, query, selectedState, selectedArea, openOnly]);

  const hasActiveFilters =
    query.trim() !== "" ||
    selectedCategory !== "all" ||
    selectedState !== "all" ||
    (selectedArea !== "all" && selectedArea !== "All Areas") ||
    openOnly ||
    priceRange !== "all";

  const handleClearFilters = () => {
    setQuery("");
    setSelectedCategory("all");
    setSelectedState("all");
    setSelectedArea("all");
    setOpenOnly(false);
    setPriceRange("all");
    setSortBy("recommended");
  };

  const activeFilterCount =
    (selectedState !== "all" ? 1 : 0) +
    (selectedArea !== "all" && selectedArea !== "All Areas" ? 1 : 0) +
    (openOnly ? 1 : 0) +
    (priceRange !== "all" ? 1 : 0) +
    (sortBy !== "recommended" ? 1 : 0);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-base-200/40 pb-24 md:pb-12">
      {/* Top Menu Bar on Desktop */}
      <CustomerTopNav user={user} isVendor={isVendor} />

      {/* Top Navbar on Mobile */}
      <header className="md:hidden sticky top-0 z-30 bg-base-100/90 backdrop-blur-md border-b border-base-200 px-4 py-3 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-1.5 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-black shadow-md shadow-primary/20">
              <ChefHat className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight leading-none">
                <span className="text-primary">CYGLASE</span>{" "}
                <span className="text-secondary">FOODS</span>
              </span>
              <span className="text-[10px] font-bold text-base-content/50 uppercase tracking-wider">
                Nigerian Food Market
              </span>
            </div>
          </Link>

          {/* User Account / Sign In */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="dropdown dropdown-end">
                <label
                  tabIndex={0}
                  className="btn btn-ghost btn-circle btn-sm bg-primary/10 text-primary font-bold text-xs"
                >
                  <User className="w-4 h-4" />
                </label>
                <ul
                  tabIndex={0}
                  className="dropdown-content menu p-2 shadow-xl bg-base-100 rounded-2xl w-52 z-40 border border-base-200 text-xs font-semibold"
                >
                  <li className="menu-title text-[10px] text-base-content/60 px-3 py-1">
                    {user.email}
                  </li>
                  <li>
                    <Link href="/account" className="py-2">
                      <User className="w-4 h-4" /> My Account
                    </Link>
                  </li>
                  <li>
                    <Link href="/orders" className="py-2">
                      <ShoppingBag className="w-4 h-4" /> My Orders
                    </Link>
                  </li>
                  {isVendor && (
                    <li>
                      <Link href="/vendor" className="py-2 text-primary font-bold">
                        <Store className="w-4 h-4" /> Kitchen Dashboard
                      </Link>
                    </li>
                  )}
                  <li>
                    <button onClick={handleSignOut} className="py-2 text-error">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              <Link
                href="/login"
                className="btn btn-primary btn-xs sm:btn-sm rounded-xl font-bold text-white text-[11px] shadow-sm"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 pt-5 space-y-6">
        {/* ======================================================== */}
        {/* 1. ELEVATED INTERACTIVE SEARCH BAR (PROPER SEARCH EXPERIENCE) */}
        {/* ======================================================== */}
        <section id="search" className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search party jollof, egusi soup, suya, zobo, or local kitchen..."
                className="input input-bordered w-full pl-12 pr-10 text-sm sm:text-base rounded-2xl bg-base-100 shadow-sm focus:input-primary h-14 font-medium border-base-300"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="btn btn-ghost btn-circle btn-xs absolute right-3.5 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content"
                  title="Clear query"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Toggle Button */}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`btn h-14 px-4 rounded-2xl font-bold gap-2 shrink-0 border transition-all ${
                showFilters || activeFilterCount > 0
                  ? "btn-primary text-white shadow-md shadow-primary/20"
                  : "btn-ghost bg-base-100 border-base-300 hover:bg-base-200 text-base-content/80 shadow-xs"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span className="badge badge-xs bg-white text-primary font-black px-1.5 py-1 rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Collapsible Location & Detail Filters Panel */}
          {showFilters && (
            <div className="card bg-base-100/95 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-base-200 shadow-md space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-base-200">
                <span className="text-xs font-black uppercase tracking-wider text-base-content/70 flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-primary" />
                  Filter by State, Area & Price
                </span>
                <div className="flex items-center gap-2">
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={handleClearFilters}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      Reset all
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowFilters(false)}
                    className="btn btn-ghost btn-circle btn-xs text-base-content/60 hover:text-base-content hover:bg-base-200"
                    title="Close filters"
                    aria-label="Close filters"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. State Filter */}
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
                    className="select select-bordered select-sm w-full rounded-xl bg-base-100 font-semibold text-xs border-base-300 shadow-xs"
                  >
                    <option value="all">All States</option>
                    {allStates.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Area Filter */}
                <div>
                  <label className="text-[11px] font-bold text-base-content/70 block mb-1">
                    Area / Neighborhood
                  </label>
                  <select
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    className="select select-bordered select-sm w-full rounded-xl bg-base-100 font-semibold text-xs border-base-300 shadow-xs"
                  >
                    <option value="all">All Areas</option>
                    {availableAreas.map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Price Range Filter */}
                <div>
                  <label className="text-[11px] font-bold text-base-content/70 block mb-1">
                    Price Range
                  </label>
                  <select
                    value={priceRange}
                    onChange={(e) => setPriceRange(e.target.value)}
                    className="select select-bordered select-sm w-full rounded-xl bg-base-100 font-semibold text-xs border-base-300 shadow-xs"
                  >
                    <option value="all">Any Price</option>
                    <option value="under-2500">Under ₦2,500</option>
                    <option value="2500-6000">₦2,500 - ₦6,000</option>
                    <option value="above-6000">Above ₦6,000</option>
                  </select>
                </div>

                {/* 4. Sort By */}
                <div>
                  <label className="text-[11px] font-bold text-base-content/70 block mb-1">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="select select-bordered select-sm w-full rounded-xl bg-base-100 font-semibold text-xs border-base-300 shadow-xs"
                  >
                    <option value="recommended">Recommended</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="name-asc">Alphabetical (A - Z)</option>
                  </select>
                </div>
              </div>

              {/* Open Kitchens Only Checkbox & Close action */}
              <div className="pt-3 border-t border-base-200/80 flex items-center justify-between gap-3 flex-wrap">
                <label className="label cursor-pointer justify-start gap-3 p-0">
                  <input
                    type="checkbox"
                    checked={openOnly}
                    onChange={(e) => setOpenOnly(e.target.checked)}
                    className="checkbox checkbox-primary checkbox-sm rounded-lg"
                  />
                  <span className="label-text text-xs font-semibold">
                    Show open kitchens accepting orders only
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() => setShowFilters(false)}
                  className="btn btn-xs sm:btn-sm btn-ghost hover:bg-base-200 text-xs font-bold rounded-xl ml-auto gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  Close Filters
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ======================================================== */}
        {/* 2. CUISINE CATEGORIES (ALWAYS ACCESSIBLE PILLS) */}
        {/* ======================================================== */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black text-base-content uppercase tracking-wider flex items-center gap-1.5">
              <UtensilsCrossed className="w-3.5 h-3.5 text-primary" />
              Explore Cuisines
            </h2>
            {selectedCategory !== "all" && (
              <button
                onClick={() => setSelectedCategory("all")}
                className="text-xs text-primary font-bold hover:underline"
              >
                Reset
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`btn btn-xs sm:btn-sm rounded-full whitespace-nowrap px-3.5 font-bold transition-all ${
                selectedCategory === "all"
                  ? "btn-primary text-white shadow-sm"
                  : "btn-ghost bg-base-100 hover:bg-base-200 border border-base-200 text-base-content/70"
              }`}
            >
              All Foods
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`btn btn-xs sm:btn-sm rounded-full whitespace-nowrap px-3.5 font-semibold transition-all ${
                  selectedCategory === cat.id
                    ? "btn-primary text-white shadow-sm"
                    : "btn-ghost bg-base-100 hover:bg-base-200 border border-base-200 text-base-content/70"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </section>

        {/* ======================================================== */}
        {/* 3. DYNAMIC VIEW: SEARCH RESULTS VS DEFAULT HOME */}
        {/* ======================================================== */}
        {hasActiveFilters ? (
          /* ACTIVE SEARCH / FILTER VIEW */
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Results Feedback Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-primary/10 rounded-2xl border border-primary/20">
              <div className="text-xs sm:text-sm font-semibold text-base-content">
                Found{" "}
                <span className="font-black text-primary">
                  {filteredDishes.length} meal{filteredDishes.length === 1 ? "" : "s"}
                </span>{" "}
                and{" "}
                <span className="font-black text-secondary">
                  {filteredVendors.length} kitchen{filteredVendors.length === 1 ? "" : "s"}
                </span>
                {query ? ` for "${query}"` : ""}
                {selectedState !== "all" ? ` in ${selectedState}` : ""}
                {selectedArea !== "all" && selectedArea !== "All Areas"
                  ? ` (${selectedArea})`
                  : ""}
              </div>

              <button
                type="button"
                onClick={handleClearFilters}
                className="btn btn-ghost btn-xs text-primary font-bold self-start sm:self-auto hover:bg-primary/20 rounded-xl"
              >
                Reset all
              </button>
            </div>

            {/* Matched Dishes Grid */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-black text-base-content flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-primary" />
                  Matching Meals ({filteredDishes.length})
                </h2>
              </div>

              {filteredDishes.length === 0 ? (
                <div className="card bg-base-100 border border-base-200 p-8 text-center rounded-3xl">
                  <UtensilsCrossed className="w-10 h-10 text-base-content/40 mx-auto mb-2" />
                  <p className="text-sm font-bold text-base-content">
                    No dishes found matching your search
                  </p>
                  <p className="text-xs text-base-content/60 mt-1 max-w-sm mx-auto">
                    Try checking your spelling, choosing a different area, or clearing some filters.
                  </p>
                  <div className="mt-4">
                    <button
                      onClick={handleClearFilters}
                      className="btn btn-primary btn-sm rounded-xl text-white font-bold"
                    >
                      Reset all
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paginatedSearchDishes.map((item) => (
                    <div
                      key={item.id}
                      className="card bg-base-100 shadow-sm border border-base-200 rounded-2xl overflow-hidden hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between"
                    >
                      <div className="p-4 flex gap-3">
                        {item.image_url ? (
                          <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 relative bg-base-200">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-20 h-20 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold">
                            <UtensilsCrossed className="w-7 h-7" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            <span className="badge badge-xs badge-ghost text-[10px] font-medium bg-base-200">
                              {item.categories?.name || "Dish"}
                            </span>
                            {item.vendors?.city_area && (
                              <span className="text-[10px] text-base-content/50">
                                • {item.vendors.city_area}
                              </span>
                            )}
                          </div>

                          <h3 className="font-bold text-xs sm:text-[13px] text-base-content truncate">
                            {item.name}
                          </h3>

                          {item.description && (
                            <p className="text-[11px] text-base-content/65 line-clamp-2 mt-0.5 leading-relaxed">
                              {item.description}
                            </p>
                          )}

                          <div className="mt-2 text-sm font-black text-primary">
                            ₦{Number(item.price).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="bg-base-200/40 px-4 py-2 border-t border-base-200 flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-base-content/70 truncate max-w-[150px]">
                          By {item.vendors?.business_name || "Local Kitchen"}
                        </span>
                        <Link
                          href={`/store/${item.vendors?.slug || ""}`}
                          className="btn btn-secondary btn-xs rounded-xl text-white font-bold gap-1 shadow-xs"
                        >
                          <ShoppingBag className="w-3 h-3" />
                          Order Now
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls for Search Results */}
                {totalSearchPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3">
                    <p className="text-xs text-base-content/60">
                      Showing{" "}
                      <span className="font-semibold text-base-content">
                        {(searchPage - 1) * SEARCH_DISHES_PER_PAGE + 1}
                      </span>{" "}
                      to{" "}
                      <span className="font-semibold text-base-content">
                        {Math.min(searchPage * SEARCH_DISHES_PER_PAGE, filteredDishes.length)}
                      </span>{" "}
                      of{" "}
                      <span className="font-semibold text-base-content">
                        {filteredDishes.length}
                      </span>{" "}
                      matching meals
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSearchPage((p) => Math.max(1, p - 1))}
                        disabled={searchPage === 1}
                        className="btn btn-sm btn-outline border-base-300 rounded-xl gap-1 text-xs"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" /> Previous
                      </button>
                      <span className="text-xs font-semibold px-2">
                        Page {searchPage} of {totalSearchPages}
                      </span>
                      <button
                        onClick={() => setSearchPage((p) => Math.min(totalSearchPages, p + 1))}
                        disabled={searchPage === totalSearchPages}
                        className="btn btn-sm btn-outline border-base-300 rounded-xl gap-1 text-xs"
                      >
                        Next <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
            </section>

            {/* Matched Kitchens */}
            {filteredVendors.length > 0 && (
              <section className="space-y-3 pt-3 border-t border-base-200">
                <h2 className="text-base sm:text-lg font-black text-base-content flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-secondary" />
                  Matching Cloud Kitchens ({filteredVendors.length})
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredVendors.map((vendor) => (
                    <div
                      key={vendor.id}
                      className="card bg-base-100 shadow-sm border border-base-200 rounded-2xl p-4 hover:border-secondary/40 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="badge badge-xs badge-ghost text-[10px] font-semibold bg-base-200">
                              {vendor.city_area || vendor.state || "Nigeria"}
                            </span>
                            {vendor.is_open ? (
                              <span className="badge badge-xs badge-success/15 text-success font-bold border-none text-[10px] gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                                Open
                              </span>
                            ) : (
                              <span className="badge badge-xs badge-ghost text-base-content/50 text-[10px]">
                                Closed
                              </span>
                            )}
                          </div>
                          <h3 className="font-bold text-sm sm:text-[15px] text-base-content truncate">
                            {vendor.business_name}
                          </h3>
                          <p className="text-xs text-base-content/60 flex items-center gap-1 mt-0.5 truncate">
                            <MapPin className="w-3 h-3 shrink-0 text-primary" />
                            {vendor.address || `${vendor.city_area}, ${vendor.city}`}
                          </p>
                        </div>

                        <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0 font-black">
                          <ChefHat className="w-5 h-5" />
                        </div>
                      </div>

                      <div className="pt-2 border-t border-base-200 flex items-center justify-between text-xs">
                        <div className="text-[11px] text-base-content/60 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {vendor.opening_time.slice(0, 5)} - {vendor.closing_time.slice(0, 5)}
                        </div>
                        <Link
                          href={`/store/${vendor.slug}`}
                          className="btn btn-secondary btn-xs rounded-xl font-bold text-white shadow-xs"
                        >
                          View Menu
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          /* DEFAULT CURATED HOME PAGE VIEW */
          <div className="space-y-6">
            {/* Hero Nigerian Cuisine Feature Carousel */}
            <div className="relative overflow-hidden rounded-3xl shadow-lg border border-base-200 bg-base-100">
              <div className="relative h-56 sm:h-72 w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={CUISINE_SLIDES[activeSlide].image}
                  alt={CUISINE_SLIDES[activeSlide].title}
                  className="w-full h-full object-cover transition-all duration-500 transform scale-100 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent flex flex-col justify-end p-5 sm:p-6 text-white">
                  <span className="badge badge-warning badge-sm font-bold text-[10px] mb-2 uppercase tracking-wider text-black">
                    ⭐ Nigerian Specialties
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                    {CUISINE_SLIDES[activeSlide].title}
                  </h2>
                  <p className="text-xs sm:text-sm text-white/80 mt-1 max-w-md line-clamp-2">
                    {CUISINE_SLIDES[activeSlide].tagline}
                  </p>

                  {/* Slider indicators */}
                  <div className="flex items-center gap-1.5 mt-3">
                    {CUISINE_SLIDES.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveSlide(idx)}
                        className={`h-1.5 rounded-full transition-all ${
                          activeSlide === idx
                            ? "w-6 bg-warning"
                            : "w-2 bg-white/40 hover:bg-white/70"
                        }`}
                        aria-label={`Slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Featured Outlets Section */}
            <section id="vendors" className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-base-content flex items-center gap-1.5">
                    <Store className="w-4 h-4 text-primary" />
                    Featured Outlets
                  </h2>
                </div>
                <Link
                  href="/vendor/login"
                  className="text-[11px] font-bold text-secondary hover:underline flex items-center gap-0.5"
                >
                  Sell Food <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              {vendors.length === 0 ? (
                <div className="card bg-base-100 border border-base-200 p-6 text-center rounded-2xl">
                  <Store className="w-8 h-8 text-base-content/40 mx-auto mb-2" />
                  <p className="text-xs font-bold text-base-content">
                    No vendors registered yet
                  </p>
                  <div className="mt-3">
                    <Link
                      href="/vendor/login"
                      className="btn btn-primary btn-xs rounded-xl font-bold text-white"
                    >
                      Register Your Kitchen
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vendors.slice(0, 6).map((vendor) => (
                    <div
                      key={vendor.id}
                      className="card bg-base-100 shadow-sm border border-base-200 rounded-2xl p-4 hover:border-primary/40 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="badge badge-xs badge-ghost text-[10px] font-semibold bg-base-200">
                              {vendor.city_area || "Lagos"}
                            </span>
                            {vendor.is_open ? (
                              <span className="badge badge-xs badge-success/15 text-success font-bold border-none text-[10px] gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                                Open Now
                              </span>
                            ) : (
                              <span className="badge badge-xs badge-ghost text-base-content/50 text-[10px]">
                                Closed
                              </span>
                            )}
                          </div>
                          <h3 className="font-bold text-sm sm:text-[15px] text-base-content truncate">
                            {vendor.business_name}
                          </h3>
                          <p className="text-xs text-base-content/60 flex items-center gap-1 mt-0.5 truncate">
                            <MapPin className="w-3 h-3 shrink-0 text-primary" />
                            {vendor.address || `${vendor.city_area}, ${vendor.city}`}
                          </p>
                        </div>

                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 font-black">
                          <ChefHat className="w-5 h-5" />
                        </div>
                      </div>

                      <div className="pt-2 border-t border-base-200 flex items-center justify-between text-xs">
                        <div className="text-[11px] text-base-content/60 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {vendor.opening_time.slice(0, 5)} - {vendor.closing_time.slice(0, 5)}
                        </div>
                        <Link
                          href={`/store/${vendor.slug}`}
                          className="btn btn-primary btn-xs rounded-xl font-bold text-white shadow-xs"
                        >
                          View Menu
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Featured Dishes Ready to Order */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-base-content flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-secondary" />
                    Dishes Ready to Order
                  </h2>
                  <p className="text-xs text-base-content/60">
                    Freshly prepared and packaged for doorstep dispatch
                  </p>
                </div>
              </div>

              {initialItems.length === 0 ? (
                <div className="card bg-base-100 border border-base-200 p-8 text-center rounded-2xl">
                  <UtensilsCrossed className="w-8 h-8 text-base-content/40 mx-auto mb-2" />
                  <p className="text-xs font-bold text-base-content">
                    No food items available right now
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {initialItems.slice(0, homeDishesCount).map((item) => (
                    <div
                      key={item.id}
                      className="card bg-base-100 shadow-sm border border-base-200 rounded-2xl overflow-hidden hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div className="p-4 flex gap-3">
                        {item.image_url ? (
                          <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 relative bg-base-200">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-20 h-20 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold">
                            <UtensilsCrossed className="w-7 h-7" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="badge badge-xs badge-ghost text-[10px] font-medium bg-base-200">
                              {item.categories?.name || "Dish"}
                            </span>
                            {item.vendors?.city_area && (
                              <span className="text-[10px] text-base-content/50">
                                • {item.vendors.city_area}
                              </span>
                            )}
                          </div>

                          <h3 className="font-bold text-xs sm:text-[13px] text-base-content truncate">
                            {item.name}
                          </h3>

                          {item.description && (
                            <p className="text-[11px] text-base-content/65 line-clamp-2 mt-0.5 leading-relaxed">
                              {item.description}
                            </p>
                          )}

                          <div className="mt-2 text-sm font-black text-primary">
                            ₦{Number(item.price).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="bg-base-200/40 px-4 py-2 border-t border-base-200 flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-base-content/70 truncate max-w-[150px]">
                          By {item.vendors?.business_name || "Local Kitchen"}
                        </span>
                        <Link
                          href={`/store/${item.vendors?.slug || ""}`}
                          className="btn btn-secondary btn-xs rounded-xl text-white font-bold gap-1 shadow-xs"
                        >
                          <ShoppingBag className="w-3 h-3" />
                          Order Now
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

                {initialItems.length > homeDishesCount && (
                  <div className="text-center pt-2">
                    <button
                      onClick={() => setHomeDishesCount((prev) => prev + 12)}
                      className="btn btn-outline border-base-300 btn-sm rounded-xl font-bold text-xs gap-1.5 hover:bg-base-200"
                    >
                      <UtensilsCrossed className="w-3.5 h-3.5 text-primary" />
                      Load More Dishes ({initialItems.length - homeDishesCount} remaining)
                    </button>
                  </div>
                )}
              </>
            )}
            </section>

            {/* Vendor Registration CTA Banner */}
            <section className="bg-gradient-to-r from-primary to-emerald-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
              <div className="relative z-10 max-w-md">
                <span className="badge badge-warning text-black font-black text-[10px] uppercase tracking-wider mb-2">
                  For Chefs & Food Vendors
                </span>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                  Start Selling Your Food Online in Lagos & Beyond
                </h3>
                <p className="text-xs text-white/80 mt-2 leading-relaxed">
                  No registration fees. Receive direct bank transfers from buyers when orders are accepted. Quick 2-minute setup.
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <Link
                    href="/vendor/login"
                    className="btn btn-warning btn-sm font-black rounded-xl text-black shadow-md"
                  >
                    Register Your Kitchen 🚀
                  </Link>
                  <Link
                    href="/vendor/login"
                    className="btn btn-ghost btn-sm text-white/90 hover:text-white rounded-xl text-xs"
                  >
                    Vendor Sign In
                  </Link>
                </div>
              </div>
              <ChefHat className="absolute -right-6 -bottom-6 w-36 h-36 text-white/10 pointer-events-none" />
            </section>
          </div>
        )}
      </main>

      {/* Mobile-first Customer Bottom Nav */}
      <CustomerBottomNav isLoggedIn={!!user} />
    </div>
  );
}
