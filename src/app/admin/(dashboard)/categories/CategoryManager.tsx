"use client";

import { useState } from "react";
import {
  upsertCategory,
  toggleCategoryActive,
  deleteCategory,
} from "../../actions";
import { Plus, Edit2, Trash2, Power, Layers } from "lucide-react";
import type { Database } from "@/types/database.types";

type Category = Database["public"]["Tables"]["categories"]["Row"] & {
  item_count?: number;
};

export default function CategoryManager({
  initialCategories,
}: {
  initialCategories: Category[];
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingCategory(null);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleToggle = async (cat: Category) => {
    // Optimistic update
    setCategories((prev) =>
      prev.map((c) => (c.id === cat.id ? { ...c, is_active: !c.is_active } : c))
    );
    const res = await toggleCategoryActive(cat.id, cat.is_active);
    if (res?.error) {
      // Revert if error
      setCategories(initialCategories);
      alert(res.error);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete category "${name}"?`)) return;
    setIsLoading(true);
    const res = await deleteCategory(id);
    setIsLoading(false);
    if (res?.error) {
      alert(`Cannot delete category: ${res.error}`);
    } else {
      setCategories((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);
    const res = await upsertCategory(formData);
    setIsLoading(false);

    if (res?.error) {
      setErrorMsg(res.error);
    } else {
      setIsModalOpen(false);
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-primary" />
            Food Categories
          </h1>
          <p className="text-xs text-base-content/60 mt-1">
            Manage standard food groups available to vendors across Cyglase Foods.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="btn btn-primary btn-sm font-bold shadow-md shadow-primary/20 gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {/* Categories Table Card */}
      <div className="card bg-base-100 border border-base-300 shadow-xs">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full text-xs">
              <thead className="bg-base-200/60 text-base-content/70">
                <tr>
                  <th className="w-12 text-center">Order</th>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Description</th>
                  <th className="text-center">Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id} className="hover">
                    <td className="text-center font-bold text-base-content/50">
                      {c.display_order}
                    </td>
                    <td>
                      <span className="font-bold text-sm text-base-content">
                        {c.name}
                      </span>
                    </td>
                    <td>
                      <code className="bg-base-200 px-1.5 py-0.5 rounded text-[11px] font-mono text-base-content/70">
                        {c.slug}
                      </code>
                    </td>
                    <td className="max-w-xs truncate text-base-content/60">
                      {c.description || "—"}
                    </td>
                    <td className="text-center">
                      <button
                        onClick={() => handleToggle(c)}
                        title="Click to toggle active state"
                        className={`badge badge-sm font-semibold cursor-pointer transition-transform active:scale-95 ${
                          c.is_active ? "badge-success text-white" : "badge-ghost"
                        }`}
                      >
                        <Power className="w-2.5 h-2.5 mr-1 inline" />
                        {c.is_active ? "Active" : "Disabled"}
                      </button>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(c)}
                          className="btn btn-ghost btn-xs btn-square text-base-content/70 hover:text-primary"
                          title="Edit Category"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id, c.name)}
                          className="btn btn-ghost btn-xs btn-square text-base-content/70 hover:text-error"
                          title="Delete Category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal for Create/Edit */}
      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md border border-base-300">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              {editingCategory ? "Edit Food Category" : "New Food Category"}
            </h3>

            {errorMsg && (
              <div role="alert" className="alert alert-error text-xs py-2 mb-4">
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="flex flex-col gap-4 text-xs">
              {editingCategory && (
                <input type="hidden" name="id" value={editingCategory.id} />
              )}

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold">Category Name *</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Swallows, Soups, Proteins"
                  defaultValue={editingCategory?.name || ""}
                  className="input input-bordered input-sm focus:input-primary"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold">Slug</span>
                  <span className="label-text-alt text-base-content/50">
                    Leave blank to auto-generate
                  </span>
                </label>
                <input
                  type="text"
                  name="slug"
                  placeholder="e.g. swallows"
                  defaultValue={editingCategory?.slug || ""}
                  className="input input-bordered input-sm focus:input-primary font-mono"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold">Description</span>
                </label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Short description or sample dishes (e.g. Pounded yam, Amala, Eba)"
                  defaultValue={editingCategory?.description || ""}
                  className="textarea textarea-bordered textarea-sm focus:textarea-primary"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-bold">Display Order</span>
                  </label>
                  <input
                    type="number"
                    name="display_order"
                    defaultValue={editingCategory?.display_order ?? categories.length + 1}
                    className="input input-bordered input-sm focus:input-primary"
                  />
                </div>

                <div className="form-control justify-end pb-1">
                  <label className="label cursor-pointer justify-start gap-3">
                    <input
                      type="checkbox"
                      name="is_active"
                      value="true"
                      defaultChecked={editingCategory ? editingCategory.is_active : true}
                      className="checkbox checkbox-primary checkbox-sm"
                    />
                    <span className="label-text font-semibold">Active in Store</span>
                  </label>
                </div>
              </div>

              <div className="modal-action mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-ghost btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary btn-sm font-bold"
                >
                  {isLoading ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : editingCategory ? (
                    "Save Changes"
                  ) : (
                    "Create Category"
                  )}
                </button>
              </div>
            </form>
          </div>
          <div
            className="modal-backdrop bg-black/40"
            onClick={() => setIsModalOpen(false)}
          ></div>
        </div>
      )}
    </div>
  );
}
