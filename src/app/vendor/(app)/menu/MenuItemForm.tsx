"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  UploadCloud,
  X,
  Clock,
  UtensilsCrossed,
  Loader2,
  Trash2,
  AlertCircle,
  Tag,
  DollarSign,
  Info,
} from "lucide-react";
import { upsertMenuItem, deleteMenuItem } from "../../actions";
import { compressImage } from "@/lib/imageCompression";
import ConfirmModal from "@/components/ConfirmModal";
import type { Database } from "@/types/database.types";

type MenuItem = Database["public"]["Tables"]["menu_items"]["Row"] & {
  categories?: { name: string; slug: string } | null;
};
type Category = Database["public"]["Tables"]["categories"]["Row"];

interface Props {
  vendorId: string;
  categories: Category[];
  initialItem?: MenuItem | null;
  mode: "create" | "edit";
}

const PREP_TIME_PRESETS = [10, 15, 20, 30, 45, 60];

export default function MenuItemForm({
  vendorId,
  categories,
  initialItem,
  mode,
}: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(initialItem?.name || "");
  const [categoryId, setCategoryId] = useState(
    initialItem?.category_id || categories[0]?.id || ""
  );
  const [price, setPrice] = useState(initialItem ? initialItem.price.toString() : "");
  const [prepTime, setPrepTime] = useState(
    initialItem?.preparation_time_minutes ? initialItem.preparation_time_minutes.toString() : "20"
  );
  const [description, setDescription] = useState(initialItem?.description || "");
  const [isAvailable, setIsAvailable] = useState(
    initialItem ? initialItem.is_available : true
  );

  // Image management
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(
    initialItem?.image_url || null
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialItem?.image_url || null
  );
  const [removeImage, setRemoveImage] = useState(false);

  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg("Image file is too large. Maximum size is 15MB.");
      return;
    }

    try {
      // Auto-compress and resize image before upload (shrinks 5MB-10MB down to ~150KB)
      const compressed = await compressImage(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.8,
        mimeType: "image/webp",
      });

      setSelectedFile(compressed);
      setRemoveImage(false);
      setErrorMsg(null);

      // Create local preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(compressed);
    } catch {
      // Fallback to original file if compression fails
      setSelectedFile(file);
      setRemoveImage(false);
      setErrorMsg(null);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setExistingImageUrl(null);
    setRemoveImage(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      if (initialItem) {
        formData.append("id", initialItem.id);
      }
      formData.append("vendor_id", vendorId);
      formData.append("category_id", categoryId);
      formData.append("name", name);
      formData.append("price", price);
      formData.append("description", description);
      formData.append("is_available", isAvailable ? "true" : "false");
      formData.append("preparation_time_minutes", prepTime);

      if (removeImage) {
        formData.append("remove_image", "true");
      } else if (selectedFile) {
        formData.append("image_file", selectedFile);
      } else if (existingImageUrl) {
        formData.append("image_url", existingImageUrl);
      }

      const res = await upsertMenuItem(formData);
      if (res?.error) {
        setErrorMsg(res.error);
        setIsSubmitting(false);
        return;
      }

      // Success, route back to menu list
      router.push("/vendor/menu");
      router.refresh();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred");
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!initialItem) return;
    setIsDeleting(true);
    setShowDeleteConfirm(false);

    try {
      const res = await deleteMenuItem(initialItem.id);
      if (res?.error) {
        setErrorMsg(res.error);
        setIsDeleting(false);
        return;
      }

      router.push("/vendor/menu");
      router.refresh();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to delete item");
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-16">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <Link
          href="/vendor/menu"
          className="btn btn-ghost btn-sm rounded-xl gap-1.5 -ml-2 text-base-content/70 hover:text-base-content"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-xs sm:text-sm font-semibold">Back to Menu</span>
        </Link>

        {mode === "edit" && initialItem && (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeleting || isSubmitting}
            className="btn btn-ghost btn-sm text-error hover:bg-error/10 rounded-xl gap-1.5"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            <span className="text-xs font-semibold">Delete</span>
          </button>
        )}
      </div>

      <div className="card bg-base-100 shadow-sm border border-base-200 rounded-3xl p-5 sm:p-8">
        {/* Title */}
        <div className="flex items-center gap-3 pb-5 border-b border-base-200 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-base-content tracking-tight">
              {mode === "create" ? "Add New Dish" : "Edit Menu Item"}
            </h1>
            <p className="text-xs sm:text-sm text-base-content/60">
              {mode === "create"
                ? "Upload appetizing photos and set preparation time for your dish"
                : `Update details, photo, and pricing for "${name || "dish"}"`}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="alert alert-error text-xs py-3 mb-6 rounded-2xl shadow-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dish Image Upload Section */}
          <div className="space-y-2">
            <label className="label text-xs sm:text-sm font-bold text-base-content/80 p-0">
              Dish Photo
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              onChange={handleImageChange}
              className="hidden"
            />

            {imagePreview ? (
              <div className="relative rounded-2xl overflow-hidden border border-base-300 bg-base-200/50 aspect-video max-h-64 flex items-center justify-center group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Dish preview"
                  className="w-full h-full object-cover"
                />

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn btn-sm btn-primary rounded-xl text-white font-bold gap-1.5 shadow-md"
                  >
                    <Camera className="w-4 h-4" /> Change Photo
                  </button>
                  <button
                    type="button"
                    onClick={handleClearImage}
                    className="btn btn-sm btn-error rounded-xl text-white font-bold gap-1.5 shadow-md"
                  >
                    <X className="w-4 h-4" /> Remove
                  </button>
                </div>

                {/* Mobile action bar overlay */}
                <div className="absolute bottom-2 right-2 flex items-center gap-1.5 group-hover:hidden">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn btn-xs bg-black/60 hover:bg-black/80 text-white border-none rounded-lg gap-1"
                  >
                    <Camera className="w-3 h-3" /> Change
                  </button>
                  <button
                    type="button"
                    onClick={handleClearImage}
                    className="btn btn-xs bg-black/60 hover:bg-error text-white border-none rounded-lg"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-base-300 hover:border-primary/50 bg-base-200/30 hover:bg-primary/5 rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-sm font-bold text-base-content block">
                    Upload Dish Photo
                  </span>
                  <span className="text-xs text-base-content/60">
                    PNG, JPG or WebP up to 10MB
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-xs btn-outline btn-primary rounded-xl mt-1"
                >
                  <Camera className="w-3.5 h-3.5 mr-1" /> Choose File
                </button>
              </div>
            )}
          </div>

          {/* Dish Name */}
          <div>
            <label className="label text-xs sm:text-sm font-bold text-base-content/80 pb-1">
              Dish Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jollof Rice & Crispy Chicken"
              className="input input-bordered w-full rounded-2xl text-sm"
            />
          </div>

          {/* Category & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label text-xs sm:text-sm font-bold text-base-content/80 pb-1 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-primary" />
                Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="select select-bordered w-full rounded-2xl text-sm"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label text-xs sm:text-sm font-bold text-base-content/80 pb-1 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-primary" />
                Price (₦ Naira) *
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
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="2500"
                  className="input input-bordered w-full pl-8 rounded-2xl text-sm font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Preparation Time */}
          <div className="p-4 bg-base-200/40 border border-base-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="label text-xs sm:text-sm font-bold text-base-content/80 p-0 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-primary" />
                Preparation Time (Minutes)
              </label>
              {prepTime && (
                <span className="badge badge-primary font-bold text-xs">
                  {prepTime} mins
                </span>
              )}
            </div>

            <p className="text-xs text-base-content/60">
              Estimated kitchen time to prepare and pack this dish before dispatch.
            </p>

            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max="180"
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
                placeholder="e.g. 20"
                className="input input-bordered w-32 rounded-xl text-sm font-bold text-center"
              />
              <span className="text-xs font-semibold text-base-content/60">
                minutes
              </span>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[11px] text-base-content/50 mr-1">Presets:</span>
              {PREP_TIME_PRESETS.map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setPrepTime(mins.toString())}
                  className={`btn btn-xs rounded-lg font-medium transition-all ${
                    prepTime === mins.toString()
                      ? "btn-primary text-white"
                      : "btn-ghost bg-base-100 hover:bg-base-200 border border-base-200 text-base-content/70"
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="label text-xs sm:text-sm font-bold text-base-content/80 pb-1">
              Description & Portion Details (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Served with sweet fried plantain (dodo), spicy pepper stew, and chilled drink."
              rows={3}
              className="textarea textarea-bordered w-full rounded-2xl text-sm leading-relaxed"
            />
          </div>

          {/* In Stock Toggle */}
          <div className="p-4 bg-base-200/40 border border-base-200 rounded-2xl flex items-center justify-between">
            <div>
              <div className="font-bold text-xs sm:text-sm text-base-content">
                Ready for Orders Now
              </div>
              <div className="text-[11px] sm:text-xs text-base-content/60 mt-0.5">
                Turn off if ingredients are currently exhausted or out of stock
              </div>
            </div>
            <input
              type="checkbox"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
              className="toggle toggle-success"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <Link
              href="/vendor/menu"
              className="btn btn-ghost flex-1 rounded-2xl text-sm"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary flex-1 rounded-2xl text-white font-bold text-sm shadow-md shadow-primary/20 gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Dish...</span>
                </>
              ) : mode === "create" ? (
                "Add Dish to Menu"
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Menu Dish"
        message={`Are you sure you want to permanently delete "${name}"? This dish will be removed from your menu and cannot be recovered.`}
        confirmText="Yes, Delete Dish"
        cancelText="Keep Dish"
        type="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
