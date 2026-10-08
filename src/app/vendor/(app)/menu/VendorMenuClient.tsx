"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  UtensilsCrossed,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Camera,
  UploadCloud,
  X,
  Tag,
  DollarSign,
} from "lucide-react";
import { toggleItemStock, upsertMenuItem, deleteMenuItem } from "../../actions";
import ConfirmModal from "@/components/ConfirmModal";
import type { Database } from "@/types/database.types";

type MenuItem = Database["public"]["Tables"]["menu_items"]["Row"] & {
  categories?: { name: string; slug: string } | null;
};

type Category = Database["public"]["Tables"]["categories"]["Row"];

interface Props {
  vendorId: string;
  initialItems: MenuItem[];
  categories: Category[];
}

const PREP_TIME_PRESETS = [10, 15, 20, 30, 45, 60];

export default function VendorMenuClient({
  vendorId,
  initialItems,
  categories,
}: Props) {
  const [items, setItems] = useState<MenuItem[]>(initialItems);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [alertInfo, setAlertInfo] = useState<{ title: string; message: string } | null>(null);

  // Form State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formName, setFormName] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formAvailable, setFormAvailable] = useState(true);
  const [formPrepTime, setFormPrepTime] = useState("20");
  const [formImagePreview, setFormImagePreview] = useState<string | null>(null);
  const [formSelectedFile, setFormSelectedFile] = useState<File | null>(null);
  const [formRemoveImage, setFormRemoveImage] = useState(false);

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesCategory =
      selectedCategory === "all" || item.category_id === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description &&
        item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE) || 1;
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const openAddModal = () => {
    setEditingItem(null);
    setFormName("");
    setFormCategoryId(categories[0]?.id || "");
    setFormPrice("");
    setFormDescription("");
    setFormAvailable(true);
    setFormPrepTime("20");
    setFormImagePreview(null);
    setFormSelectedFile(null);
    setFormRemoveImage(false);
    setActionError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormCategoryId(item.category_id);
    setFormPrice(item.price.toString());
    setFormDescription(item.description || "");
    setFormAvailable(item.is_available);
    setFormPrepTime(
      item.preparation_time_minutes ? item.preparation_time_minutes.toString() : "20"
    );
    setFormImagePreview(item.image_url || null);
    setFormSelectedFile(null);
    setFormRemoveImage(false);
    setActionError(null);
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("action") === "add") {
        if (window.innerWidth < 768) {
          window.location.href = "/vendor/menu/new";
        } else {
          openAddModal();
        }
      }
    }
  }, []);

  const handleStockToggle = async (item: MenuItem) => {
    setTogglingId(item.id);
    try {
      const res = await toggleItemStock(item.id, item.is_available);
      if (res.success) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, is_available: !i.is_available } : i
          )
        );
      } else {
        setAlertInfo({
          title: "Update Failed",
          message: res.error || "Failed to update item stock status.",
        });
      }
    } finally {
      setTogglingId(null);
    }
  };

  const confirmDeleteItem = async () => {
    if (!deleteTarget) return;
    const { id } = deleteTarget;
    setDeletingId(id);
    setDeleteTarget(null);
    try {
      const res = await deleteMenuItem(id);
      if (res.success) {
        setItems((prev) => prev.filter((i) => i.id !== id));
      } else {
        setAlertInfo({
          title: "Delete Failed",
          message: res.error || "Could not delete this menu item.",
        });
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setActionError("Image file is too large. Maximum size is 10MB.");
      return;
    }

    setFormSelectedFile(file);
    setFormRemoveImage(false);
    setActionError(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = () => {
    setFormSelectedFile(null);
    setFormImagePreview(null);
    setFormRemoveImage(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setActionError(null);

    const formData = new FormData();
    if (editingItem) formData.append("id", editingItem.id);
    formData.append("vendor_id", vendorId);
    formData.append("category_id", formCategoryId);
    formData.append("name", formName);
    formData.append("price", formPrice);
    formData.append("description", formDescription);
    formData.append("is_available", formAvailable ? "true" : "false");
    formData.append("preparation_time_minutes", formPrepTime);

    if (formRemoveImage) {
      formData.append("remove_image", "true");
    } else if (formSelectedFile) {
      formData.append("image_file", formSelectedFile);
    } else if (editingItem?.image_url) {
      formData.append("image_url", editingItem.image_url);
    }

    try {
      const res = await upsertMenuItem(formData);
      if (res?.error) {
        setActionError(res.error);
        setIsSubmitting(false);
        return;
      }

      // Successfully saved, update local state or reload
      const targetCat = categories.find((c) => c.id === formCategoryId);
      if (editingItem) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === editingItem.id
              ? {
                  ...i,
                  name: formName,
                  category_id: formCategoryId,
                  price: parseFloat(formPrice),
                  description: formDescription || null,
                  is_available: formAvailable,
                  preparation_time_minutes: formPrepTime ? parseInt(formPrepTime, 10) : null,
                  image_url: formRemoveImage
                    ? null
                    : formImagePreview || i.image_url,
                  categories: targetCat
                    ? { name: targetCat.name, slug: targetCat.slug }
                    : i.categories,
                }
              : i
          )
        );
      } else {
        window.location.reload();
      }

      setIsModalOpen(false);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Quick Add */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-base-content flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-primary" />
            Kitchen Menu
          </h1>
          <p className="text-xs sm:text-sm text-base-content/60">
            {items.length} dishes in your food catalogue
          </p>
        </div>

        {/* Mobile: Link to dedicated page */}
        <Link
          href="/vendor/menu/new"
          className="btn btn-primary btn-sm sm:btn-md gap-1.5 shadow-md shadow-primary/20 text-white rounded-xl md:hidden"
        >
          <Plus className="w-4 h-4" />
          <span className="font-bold">Add Dish</span>
        </Link>

        {/* Desktop: Modal trigger */}
        <button
          onClick={openAddModal}
          className="btn btn-primary btn-sm sm:btn-md gap-1.5 shadow-md shadow-primary/20 text-white rounded-xl hidden md:inline-flex"
        >
          <Plus className="w-4 h-4" />
          <span className="font-bold">Add Dish</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Search your menu dishes..."
          className="input input-bordered w-full pl-10 text-sm rounded-xl bg-base-100 shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery("");
              setCurrentPage(1);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-base-content/50 hover:text-base-content"
          >
            Clear
          </button>
        )}
      </div>

      {/* Category Pills Slider - Scrollable on mobile */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          onClick={() => {
            setSelectedCategory("all");
            setCurrentPage(1);
          }}
          className={`btn btn-xs sm:btn-sm rounded-full whitespace-nowrap px-3.5 font-medium transition-all ${
            selectedCategory === "all"
              ? "btn-primary text-white shadow-sm"
              : "btn-ghost bg-base-100 hover:bg-base-200 border border-base-200 text-base-content/70"
          }`}
        >
          All Dishes ({items.length})
        </button>
        {categories.map((cat) => {
          const count = items.filter((i) => i.category_id === cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setCurrentPage(1);
              }}
              className={`btn btn-xs sm:btn-sm rounded-full whitespace-nowrap px-3.5 font-medium transition-all ${
                selectedCategory === cat.id
                  ? "btn-primary text-white shadow-sm"
                  : "btn-ghost bg-base-100 hover:bg-base-200 border border-base-200 text-base-content/70"
              }`}
            >
              {cat.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Menu List */}
      {filteredItems.length === 0 ? (
        <div className="card bg-base-100 shadow-sm border border-base-200 p-8 text-center rounded-2xl">
          <div className="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center mx-auto mb-3 text-base-content/40">
            <UtensilsCrossed className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-base text-base-content">
            {searchQuery ? "No dishes match your search" : "No dishes in this category"}
          </h3>
          <p className="text-xs text-base-content/60 mt-1 max-w-xs mx-auto">
            {searchQuery
              ? "Try searching for a different food item or clear the filter."
              : "Start adding mouthwatering meals, swallows, drinks or soups with photos and preparation times."}
          </p>
          <div className="mt-4">
            {/* Mobile Link */}
            <Link
              href="/vendor/menu/new"
              className="btn btn-primary btn-sm rounded-xl text-white font-bold md:hidden"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Your First Dish
            </Link>
            {/* Desktop Button */}
            <button
              onClick={openAddModal}
              className="btn btn-primary btn-sm rounded-xl text-white font-bold hidden md:inline-flex"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Your First Dish
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedItems.map((item) => {
            const isToggling = togglingId === item.id;
            const isDeleting = deletingId === item.id;

            return (
              <div
                key={item.id}
                className={`card bg-base-100 shadow-sm border rounded-2xl transition-all p-4 ${
                  item.is_available
                    ? "border-base-200 hover:border-primary/30"
                    : "border-base-300 bg-base-200/50 opacity-80"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Dish Image Thumbnail */}
                  {item.image_url ? (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 bg-base-200 border border-base-200/80">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl shrink-0 bg-base-200/60 border border-dashed border-base-300 flex flex-col items-center justify-center text-base-content/40 p-2 text-center">
                      <UtensilsCrossed className="w-5 h-5 mb-1" />
                      <span className="text-[10px] font-medium leading-tight">No Photo</span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className="badge badge-sm badge-ghost font-medium text-xs bg-base-200 text-base-content/70 border-none">
                        {item.categories?.name || "Dish"}
                      </span>
                      {item.is_available ? (
                        <span className="badge badge-sm badge-success/15 text-success font-semibold border-none text-[11px] gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                          In Stock
                        </span>
                      ) : (
                        <span className="badge badge-sm badge-error/15 text-error font-semibold border-none text-[11px] gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                          Sold Out
                        </span>
                      )}
                      {item.preparation_time_minutes ? (
                        <span className="badge badge-sm badge-ghost font-medium text-[11px] bg-base-200 text-base-content/70 border-none gap-1">
                          <Clock className="w-3 h-3 text-primary" />
                          {item.preparation_time_minutes}m prep
                        </span>
                      ) : null}
                    </div>

                    <h3 className="font-bold text-base text-base-content truncate">
                      {item.name}
                    </h3>

                    {item.description && (
                      <p className="text-xs text-base-content/65 line-clamp-2 mt-0.5">
                        {item.description}
                      </p>
                    )}

                    <div className="mt-2 text-base font-black text-primary flex items-center">
                      ₦{Number(item.price).toLocaleString()}
                    </div>
                  </div>

                  {/* Stock switch & Actions */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="form-control">
                      <label className="label cursor-pointer p-0 gap-1.5">
                        <span className="text-[11px] font-semibold text-base-content/60">
                          {item.is_available ? "Available" : "Off"}
                        </span>
                        <input
                          type="checkbox"
                          checked={item.is_available}
                          disabled={isToggling}
                          onChange={() => handleStockToggle(item)}
                          className="toggle toggle-success toggle-sm"
                        />
                      </label>
                    </div>

                    {/* Edit & Delete Buttons */}
                    <div className="flex items-center gap-1 mt-1">
                      {/* Mobile Edit: Dedicated page */}
                      <Link
                        href={`/vendor/menu/${item.id}`}
                        className="btn btn-ghost btn-xs btn-square text-base-content/60 hover:text-primary hover:bg-primary/10 rounded-lg md:hidden"
                        title="Edit Dish"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Link>

                      {/* Desktop Edit: Modal */}
                      <button
                        onClick={() => openEditModal(item)}
                        className="btn btn-ghost btn-xs btn-square text-base-content/60 hover:text-primary hover:bg-primary/10 rounded-lg hidden md:inline-flex"
                        title="Edit Dish"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setDeleteTarget({ id: item.id, name: item.name })}
                        disabled={isDeleting}
                        className="btn btn-ghost btn-xs btn-square text-base-content/40 hover:text-error hover:bg-error/10 rounded-lg"
                        title="Delete Dish"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <p className="text-xs text-base-content/60">
            Showing{" "}
            <span className="font-semibold text-base-content">
              {(currentPage - 1) * ITEMS_PER_PAGE + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-base-content">
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-base-content">
              {filteredItems.length}
            </span>{" "}
            dishes
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="btn btn-sm btn-outline border-base-300 rounded-xl gap-1 text-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <span className="text-xs font-semibold px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="btn btn-sm btn-outline border-base-300 rounded-xl gap-1 text-xs"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Desktop Modal for Add / Edit Dish */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-base-100 w-full max-w-xl rounded-3xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-base-200 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-lg text-base-content">
                  {editingItem ? "Edit Dish" : "Add New Dish"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="btn btn-ghost btn-sm btn-circle"
              >
                ✕
              </button>
            </div>

            {actionError && (
              <div className="alert alert-error text-xs py-2 mb-4 rounded-xl">
                <AlertCircle className="w-4 h-4" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Photo Upload in Desktop Modal */}
              <div className="space-y-1.5">
                <label className="label text-xs font-bold text-base-content/80 p-0">
                  Dish Photo
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handleImageFileChange}
                  className="hidden"
                />

                {formImagePreview ? (
                  <div className="relative rounded-2xl overflow-hidden border border-base-300 bg-base-200/50 aspect-video max-h-48 flex items-center justify-center group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formImagePreview}
                      alt="Dish preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="btn btn-xs btn-primary rounded-xl text-white font-bold gap-1 shadow-md"
                      >
                        <Camera className="w-3.5 h-3.5" /> Change
                      </button>
                      <button
                        type="button"
                        onClick={handleClearImage}
                        className="btn btn-xs btn-error rounded-xl text-white font-bold gap-1 shadow-md"
                      >
                        <X className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-base-300 hover:border-primary/50 bg-base-200/30 hover:bg-primary/5 rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5"
                  >
                    <UploadCloud className="w-6 h-6 text-primary" />
                    <span className="text-xs font-bold text-base-content">
                      Click to upload photo (JPG, PNG, WebP)
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="label text-xs font-bold text-base-content/80 pb-1">
                  Dish Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Jollof Rice & Crispy Chicken"
                  className="input input-bordered w-full rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs font-bold text-base-content/80 pb-1 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-primary" /> Category *
                  </label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    required
                    className="select select-bordered w-full rounded-xl text-sm"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label text-xs font-bold text-base-content/80 pb-1 flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-primary" /> Price (₦ Naira) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-sm text-base-content/50">
                      ₦
                    </span>
                    <input
                      type="number"
                      required
                      min="50"
                      step="50"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      placeholder="2500"
                      className="input input-bordered w-full pl-8 rounded-xl text-sm font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Prep time in Desktop Modal */}
              <div className="p-3 bg-base-200/40 border border-base-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="label text-xs font-bold text-base-content/80 p-0 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-primary" /> Prep Time (Minutes)
                  </label>
                  <span className="badge badge-primary font-bold text-[11px]">
                    {formPrepTime} mins
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="180"
                    step="5"
                    value={formPrepTime}
                    onChange={(e) => setFormPrepTime(e.target.value)}
                    placeholder="20"
                    className="input input-bordered input-sm w-24 rounded-lg font-bold text-center"
                  />
                  <div className="flex items-center gap-1 flex-wrap">
                    {PREP_TIME_PRESETS.map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setFormPrepTime(mins.toString())}
                        className={`btn btn-xs rounded-lg ${
                          formPrepTime === mins.toString()
                            ? "btn-primary text-white"
                            : "btn-ghost bg-base-100 border border-base-200"
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="label text-xs font-bold text-base-content/80 pb-1">
                  Description / Portion Details (Optional)
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="e.g. Served with sweet fried dodo, spicy pepper sauce, and cold beverage of choice."
                  rows={2}
                  className="textarea textarea-bordered w-full rounded-xl text-sm"
                />
              </div>

              <div className="p-3 bg-base-200/50 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-base-content">
                    Ready to prepare now?
                  </div>
                  <div className="text-[11px] text-base-content/60">
                    Turn off if ingredient is temporarily out of stock
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formAvailable}
                  onChange={(e) => setFormAvailable(e.target.checked)}
                  className="toggle toggle-success"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-ghost flex-1 rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary flex-1 rounded-xl text-white font-bold text-sm shadow-md shadow-primary/20"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : editingItem ? (
                    "Save Changes"
                  ) : (
                    "Add to Menu"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-app Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Remove Menu Dish"
        message={`Are you sure you want to remove "${deleteTarget?.name}" from your food menu? This cannot be undone.`}
        confirmText="Delete Dish"
        cancelText="Keep Dish"
        type="danger"
        onConfirm={confirmDeleteItem}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* In-app Alert Modal */}
      <ConfirmModal
        isOpen={!!alertInfo}
        title={alertInfo?.title || "Notice"}
        message={alertInfo?.message || ""}
        confirmText="Dismiss"
        showCancel={false}
        type="warning"
        onConfirm={() => setAlertInfo(null)}
      />
    </div>
  );
}
