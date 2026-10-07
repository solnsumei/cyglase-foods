"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
  ChevronRight,
  CheckCircle2,
  X,
  User,
  LogOut,
} from "lucide-react";
import type { Database } from "@/types/database.types";
import CustomerBottomNav from "./CustomerBottomNav";
import CustomerTopNav from "./CustomerTopNav";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Vendor = Database["public"]["Tables"]["vendors"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];
type MenuItem = Database["public"]["Tables"]["menu_items"]["Row"] & {
  vendors?: {
    business_name: string;
    slug: string;
    city_area: string;
    is_open: boolean;
  } | null;
  categories?: {
    name: string;
    slug: string;
  } | null;
};

interface Props {
  user: any;
  isVendor?: boolean;
  categories: Category[];
  vendors: Vendor[];
  featuredItems: MenuItem[];
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
  featuredItems,
}: Props) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedArea, setSelectedArea] = useState<string>("All Areas");
  const [activeSlide, setActiveSlide] = useState(0);

  // Distinct areas from vendors
  const areas = Array.from(new Set(vendors.map((v) => v.city_area).filter(Boolean)));

  // Filtered dishes
  const filteredDishes = featuredItems.filter((item) => {
    const matchesSearch =
      searchQuery === "" ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description &&
        item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.vendors?.business_name &&
        item.vendors.business_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === "all" || item.category_id === selectedCategory;

    const matchesArea =
      selectedArea === "All Areas" || item.vendors?.city_area === selectedArea;

    return matchesSearch && matchesCategory && matchesArea;
  });

  // Filtered vendors
  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch =
      searchQuery === "" ||
      vendor.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.city_area.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesArea =
      selectedArea === "All Areas" || vendor.city_area === selectedArea;

    return matchesSearch && matchesArea;
  });

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

          {/* Location Picker / User status */}
          <div className="flex items-center gap-2">
            <div className="dropdown dropdown-end">
              <label
                tabIndex={0}
                className="btn btn-ghost btn-xs sm:btn-sm gap-1 text-[11px] font-bold text-base-content/80 rounded-xl bg-base-200/60"
              >
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span className="truncate max-w-[80px] sm:max-w-[120px]">
                  {selectedArea}
                </span>
              </label>
              <ul
                tabIndex={0}
                className="dropdown-content menu p-2 shadow-xl bg-base-100 rounded-2xl w-48 z-40 border border-base-200 text-xs font-semibold"
              >
                <li>
                  <button
                    onClick={() => setSelectedArea("All Areas")}
                    className={selectedArea === "All Areas" ? "active" : ""}
                  >
                    All Areas
                  </button>
                </li>
                {areas.map((area) => (
                  <li key={area}>
                    <button
                      onClick={() => setSelectedArea(area)}
                      className={selectedArea === area ? "active" : ""}
                    >
                      {area}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-4 space-y-6">
        {/* Search Bar with Anchor */}
        <div id="search" className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchQuery.trim()) {
                  router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                }
              }}
              placeholder="Search Jollof, Egusi, Suya, Zobo, or local kitchen..."
              className="input input-bordered w-full pl-10 pr-10 text-sm rounded-2xl bg-base-100 shadow-xs focus:input-primary h-12"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="btn btn-ghost btn-circle btn-xs absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <Link
            href={searchQuery.trim() ? `/search?q=${encodeURIComponent(searchQuery.trim())}` : "/search"}
            className="btn btn-primary h-12 px-4 rounded-2xl text-white font-bold shrink-0 shadow-xs"
            title="Open Full Search Page"
          >
            <Search className="w-4 h-4 hidden sm:inline" />
            <span>Search</span>
          </Link>
        </div>

        {/* Hero Nigerian Cuisine Feature Carousel */}
        {!searchQuery && (
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
        )}

        {/* Cuisine Category Pills */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-base-content uppercase tracking-wider flex items-center gap-1.5">
              <UtensilsCrossed className="w-4 h-4 text-primary" />
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

        {/* Food Vendors & Kitchens Section */}
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

          {filteredVendors.length === 0 ? (
            <div className="card bg-base-100 border border-base-200 p-6 text-center rounded-2xl">
              <Store className="w-8 h-8 text-base-content/40 mx-auto mb-2" />
              <p className="text-xs font-bold text-base-content">
                No vendors found in this area yet
              </p>
              <p className="text-[11px] text-base-content/60 mt-1">
                Be the first to open a kitchen in {selectedArea}!
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredVendors.map((vendor) => (
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

        {/* Featured Dishes Grid */}
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

          {filteredDishes.length === 0 ? (
            <div className="card bg-base-100 border border-base-200 p-8 text-center rounded-2xl">
              <UtensilsCrossed className="w-8 h-8 text-base-content/40 mx-auto mb-2" />
              <p className="text-xs font-bold text-base-content">
                No food items match your filter
              </p>
              <p className="text-[11px] text-base-content/60 mt-1">
                Try searching for another dish or clear your filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {filteredDishes.map((item) => (
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
      </main>

      {/* Mobile-first Customer Bottom Nav */}
      <CustomerBottomNav isLoggedIn={!!user} />
    </div>
  );
}
