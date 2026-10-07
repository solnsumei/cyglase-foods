"use client";

import { useState } from "react";
import { toggleMenuItemAvailability } from "../../actions";
import { UtensilsCrossed, Power, Search, Store } from "lucide-react";
import type { Database } from "@/types/database.types";

type MenuItem = Database["public"]["Tables"]["menu_items"]["Row"] & {
  vendors?: {
    business_name: string;
    city_area: string;
  } | null;
  categories?: {
    name: string;
    slug: string;
  } | null;
};

export default function MenuItemsList({
  initialItems,
  categories,
}: {
  initialItems: MenuItem[];
  categories: { id: string; name: string; slug: string }[];
}) {
  const [items, setItems] = useState(initialItems);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const handleToggle = async (item: MenuItem) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, is_available: !i.is_available } : i
      )
    );
    const res = await toggleMenuItemAvailability(item.id, item.is_available);
    if (res?.error) {
      setItems(initialItems);
      alert(res.error);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesCategory =
      selectedCategory === "all" || item.category_id === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.vendors?.business_name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
          <UtensilsCrossed className="w-6 h-6 text-primary" />
          Menu Items Catalog
        </h1>
        <p className="text-xs text-base-content/60 mt-1">
          Catalog oversight for all dishes, swallows, soups, and drinks across vendors.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-base-content/40 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search dish or vendor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input input-bordered input-sm pl-9 w-full focus:input-primary text-xs"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`btn btn-xs rounded-full font-bold ${
              selectedCategory === "all"
                ? "btn-primary text-white"
                : "btn-ghost border border-base-300"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`btn btn-xs rounded-full font-bold shrink-0 ${
                selectedCategory === cat.id
                  ? "btn-primary text-white"
                  : "btn-ghost border border-base-300"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card bg-base-100 border border-base-300 shadow-xs">
        <div className="card-body p-0">
          {filteredItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full text-xs">
                <thead className="bg-base-200/60 text-base-content/70">
                  <tr>
                    <th>Dish / Item</th>
                    <th>Category</th>
                    <th>Vendor</th>
                    <th>Price (NGN)</th>
                    <th className="text-center">Availability</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover">
                      <td>
                        <div className="font-bold text-sm text-base-content">
                          {item.name}
                        </div>
                        {item.description && (
                          <div className="text-[11px] text-base-content/60 max-w-sm truncate">
                            {item.description}
                          </div>
                        )}
                      </td>

                      <td>
                        <span className="badge badge-sm badge-outline font-semibold">
                          {item.categories?.name || "Uncategorized"}
                        </span>
                      </td>

                      <td>
                        <div className="flex items-center gap-1.5">
                          <Store className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="font-semibold text-xs">
                            {item.vendors?.business_name || "Unknown"}
                          </span>
                        </div>
                        {item.vendors?.city_area && (
                          <span className="text-[10px] text-base-content/50">
                            {item.vendors.city_area}
                          </span>
                        )}
                      </td>

                      <td>
                        <span className="font-black text-sm text-primary">
                          ₦{Number(item.price).toLocaleString()}
                        </span>
                      </td>

                      <td className="text-center">
                        <button
                          onClick={() => handleToggle(item)}
                          className={`badge badge-sm font-semibold cursor-pointer transition-transform active:scale-95 ${
                            item.is_available
                              ? "badge-success text-white"
                              : "badge-ghost"
                          }`}
                        >
                          <Power className="w-2.5 h-2.5 mr-1 inline" />
                          {item.is_available ? "In Stock" : "Out of Stock"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center">
              <UtensilsCrossed className="w-12 h-12 text-base-content/30 mx-auto mb-3" />
              <h3 className="font-bold text-base text-base-content">
                No menu items found
              </h3>
              <p className="text-xs text-base-content/60 max-w-sm mx-auto mt-1">
                {searchQuery || selectedCategory !== "all"
                  ? "Try clearing the search or category filter to see items."
                  : "When vendors create their menu dishes and swallows, they will show up here."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
