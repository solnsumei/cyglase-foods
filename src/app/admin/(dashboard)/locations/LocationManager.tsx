"use client";

import { useState, useMemo } from "react";
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Power,
  Building2,
  Search,
  CheckCircle2,
  Layers,
  ChevronRight,
  Filter,
} from "lucide-react";
import {
  upsertState,
  toggleStateActive,
  deleteState,
  upsertCity,
  toggleCityActive,
  deleteCity,
} from "../../actions";
import type { StateRow, CityRow } from "@/lib/locations";

export default function LocationManager({
  initialLocations,
}: {
  initialLocations: StateRow[];
}) {
  const [locations, setLocations] = useState<StateRow[]>(initialLocations);
  const [selectedStateId, setSelectedStateId] = useState<string>(
    initialLocations[0]?.id || ""
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modals state
  const [isStateModalOpen, setIsStateModalOpen] = useState(false);
  const [editingState, setEditingState] = useState<StateRow | null>(null);

  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<CityRow | null>(null);

  // Active state object
  const activeState = useMemo(() => {
    return locations.find((l) => l.id === selectedStateId) || locations[0] || null;
  }, [locations, selectedStateId]);

  // Overall metrics
  const totalCitiesCount = useMemo(() => {
    return locations.reduce((acc, curr) => acc + (curr.cities?.length || 0), 0);
  }, [locations]);

  // Filtered cities for active state
  const displayedCities = useMemo(() => {
    if (!activeState) return [];
    const list = activeState.cities || [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((c) => c.name.toLowerCase().includes(q));
  }, [activeState, searchQuery]);

  // Handlers for State
  const handleToggleState = async (state: StateRow) => {
    setLocations((prev) =>
      prev.map((s) => (s.id === state.id ? { ...s, is_active: !s.is_active } : s))
    );
    const res = await toggleStateActive(state.id, state.is_active);
    if (res?.error) {
      setLocations(initialLocations);
      alert(res.error);
    }
  };

  const handleDeleteState = async (id: string, name: string) => {
    if (
      !confirm(
        `Are you sure you want to delete state "${name}"? This will also remove all its cities/areas!`
      )
    )
      return;

    setIsLoading(true);
    const res = await deleteState(id);
    setIsLoading(false);

    if (res?.error) {
      alert(`Cannot delete state: ${res.error}`);
    } else {
      setLocations((prev) => prev.filter((s) => s.id !== id));
      if (selectedStateId === id) {
        setSelectedStateId(locations.find((s) => s.id !== id)?.id || "");
      }
    }
  };

  const handleStateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);
    const res = await upsertState(formData);
    setIsLoading(false);

    if (res?.error) {
      setErrorMsg(res.error);
    } else {
      setIsStateModalOpen(false);
      window.location.reload();
    }
  };

  // Handlers for City
  const handleToggleCity = async (city: CityRow) => {
    setLocations((prev) =>
      prev.map((s) =>
        s.id === city.state_id
          ? {
              ...s,
              cities: (s.cities || []).map((c) =>
                c.id === city.id ? { ...c, is_active: !c.is_active } : c
              ),
            }
          : s
      )
    );
    const res = await toggleCityActive(city.id, city.is_active);
    if (res?.error) {
      setLocations(initialLocations);
      alert(res.error);
    }
  };

  const handleDeleteCity = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete city/area "${name}"?`)) return;

    setIsLoading(true);
    const res = await deleteCity(id);
    setIsLoading(false);

    if (res?.error) {
      alert(`Cannot delete city: ${res.error}`);
    } else {
      setLocations((prev) =>
        prev.map((s) => ({
          ...s,
          cities: (s.cities || []).filter((c) => c.id !== id),
        }))
      );
    }
  };

  const handleCitySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);
    const res = await upsertCity(formData);
    setIsLoading(false);

    if (res?.error) {
      setErrorMsg(res.error);
    } else {
      setIsCityModalOpen(false);
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-base-content flex items-center gap-2">
            <MapPin className="w-7 h-7 text-primary" />
            Locations & Delivery Areas
          </h1>
          <p className="text-xs sm:text-sm text-base-content/60">
            Manage Nigerian states, cities, and vendor service areas dynamically from the database
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setEditingState(null);
              setErrorMsg(null);
              setIsStateModalOpen(true);
            }}
            className="btn btn-outline btn-sm rounded-xl font-bold gap-1 text-xs"
          >
            <Plus className="w-4 h-4" />
            Add State
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingCity(null);
              setErrorMsg(null);
              setIsCityModalOpen(true);
            }}
            className="btn btn-primary btn-sm rounded-xl font-bold gap-1 text-xs shadow-md shadow-primary/20 text-white"
          >
            <Plus className="w-4 h-4" />
            Add City / Area
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card bg-base-100 p-4 border border-base-200 rounded-2xl shadow-xs">
          <span className="text-[11px] font-bold text-base-content/60 uppercase">
            Active States
          </span>
          <div className="text-2xl font-black text-primary mt-1">
            {locations.filter((l) => l.is_active).length}{" "}
            <span className="text-xs font-semibold text-base-content/40">
              / {locations.length}
            </span>
          </div>
        </div>

        <div className="card bg-base-100 p-4 border border-base-200 rounded-2xl shadow-xs">
          <span className="text-[11px] font-bold text-base-content/60 uppercase">
            Total Cities / Areas
          </span>
          <div className="text-2xl font-black text-secondary mt-1">
            {totalCitiesCount}
          </div>
        </div>

        <div className="card bg-base-100 p-4 border border-base-200 rounded-2xl shadow-xs col-span-2">
          <span className="text-[11px] font-bold text-base-content/60 uppercase">
            Quick Auto-Provision Notice
          </span>
          <p className="text-xs text-base-content/70 mt-1 leading-snug">
            When vendors input a new area during registration or onboarding, it is <strong>auto-seeded</strong> here into the database.
          </p>
        </div>
      </div>

      {/* State Selector & City List Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* State Sidebar (Desktop: 4 cols, Mobile: full) */}
        <div className="lg:col-span-4 card bg-base-100 border border-base-200 rounded-2xl p-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-base-200 px-2">
            <span className="text-xs font-black uppercase tracking-wider text-base-content/60">
              States ({locations.length})
            </span>
            <button
              onClick={() => {
                setEditingState(null);
                setErrorMsg(null);
                setIsStateModalOpen(true);
              }}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5"
            >
              <Plus className="w-3.5 h-3.5" /> New
            </button>
          </div>

          <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
            {locations.map((st) => {
              const isSelected = st.id === (activeState?.id || selectedStateId);
              return (
                <div
                  key={st.id}
                  onClick={() => setSelectedStateId(st.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${
                    isSelected
                      ? "bg-primary/10 border-primary/30 text-primary font-bold shadow-xs"
                      : "bg-base-200/40 hover:bg-base-200 border-transparent text-base-content"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`badge badge-xs ${
                        st.is_active ? "badge-success" : "badge-ghost"
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="text-sm truncate font-bold leading-tight">
                        {st.name}
                      </div>
                      <div className="text-[10px] text-base-content/50 font-normal">
                        Code: {st.code} • {st.cities?.length || 0} areas
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      title={st.is_active ? "Deactivate" : "Activate"}
                      onClick={() => handleToggleState(st)}
                      className={`btn btn-ghost btn-xs btn-square ${
                        st.is_active ? "text-success" : "text-base-content/30"
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Edit State"
                      onClick={() => {
                        setEditingState(st);
                        setErrorMsg(null);
                        setIsStateModalOpen(true);
                      }}
                      className="btn btn-ghost btn-xs btn-square text-base-content/60 hover:text-primary"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cities Table (Desktop: 8 cols, Mobile: full) */}
        <div className="lg:col-span-8 card bg-base-100 border border-base-200 rounded-2xl shadow-xs overflow-hidden">
          {activeState ? (
            <div>
              {/* City Header */}
              <div className="p-4 border-b border-base-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-base-200/20">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-base-content">
                      {activeState.name}
                    </h2>
                    <span className="badge badge-primary badge-sm font-bold">
                      {activeState.code}
                    </span>
                    <span
                      className={`badge badge-sm font-semibold ${
                        activeState.is_active ? "badge-success" : "badge-ghost"
                      }`}
                    >
                      {activeState.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-xs text-base-content/60 mt-0.5">
                    {activeState.cities?.length || 0} cities/neighborhoods configured
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative w-48 sm:w-60">
                    <Search className="w-3.5 h-3.5 text-base-content/40 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Search area..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="input input-bordered input-sm pl-8 w-full rounded-xl text-xs"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingCity(null);
                      setErrorMsg(null);
                      setIsCityModalOpen(true);
                    }}
                    className="btn btn-primary btn-sm rounded-xl font-bold gap-1 text-xs text-white"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Area
                  </button>
                </div>
              </div>

              {/* Cities List */}
              <div className="overflow-x-auto">
                <table className="table table-sm">
                  <thead>
                    <tr className="bg-base-200/50 text-[11px] text-base-content/60">
                      <th>Order</th>
                      <th>City / Area Name</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedCities.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-10 text-xs text-base-content/50">
                          No cities found in {activeState.name}. Click &quot;Add Area&quot; to create one.
                        </td>
                      </tr>
                    ) : (
                      displayedCities.map((city) => (
                        <tr key={city.id} className="hover:bg-base-200/30">
                          <td className="font-mono text-xs text-base-content/50 w-16">
                            #{city.display_order}
                          </td>
                          <td className="font-bold text-sm text-base-content">
                            {city.name}
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => handleToggleCity(city)}
                              className={`btn btn-xs rounded-lg gap-1 font-semibold ${
                                city.is_active
                                  ? "btn-success btn-outline"
                                  : "btn-ghost text-base-content/40"
                              }`}
                            >
                              <Power className="w-3 h-3" />
                              {city.is_active ? "Active" : "Inactive"}
                            </button>
                          </td>
                          <td className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCity(city);
                                  setErrorMsg(null);
                                  setIsCityModalOpen(true);
                                }}
                                className="btn btn-ghost btn-xs btn-square text-base-content/60 hover:text-primary"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCity(city.id, city.name)}
                                className="btn btn-ghost btn-xs btn-square text-base-content/60 hover:text-error"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-base-content/60 text-sm">
              Please create or select a state to view its cities and neighborhoods.
            </div>
          )}
        </div>
      </div>

      {/* Modal 1: State Upsert */}
      {isStateModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md rounded-2xl">
            <h3 className="font-black text-lg text-base-content flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              {editingState ? "Edit State" : "Add New State"}
            </h3>

            {errorMsg && (
              <div className="alert alert-error text-xs p-2 mt-3 rounded-xl">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleStateSubmit} className="space-y-4 mt-4">
              {editingState && (
                <input type="hidden" name="id" value={editingState.id} />
              )}

              <div>
                <label className="label text-xs font-bold text-base-content/80 pb-1">
                  State Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingState?.name || ""}
                  placeholder="e.g. Lagos or Anambra"
                  className="input input-bordered w-full rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs font-bold text-base-content/80 pb-1">
                    State Code (3 letters)
                  </label>
                  <input
                    type="text"
                    name="code"
                    defaultValue={editingState?.code || ""}
                    placeholder="e.g. LAG"
                    maxLength={10}
                    className="input input-bordered w-full rounded-xl text-sm font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="label text-xs font-bold text-base-content/80 pb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    name="display_order"
                    defaultValue={editingState?.display_order ?? 50}
                    className="input input-bordered w-full rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-3 py-1">
                  <input
                    type="checkbox"
                    name="is_active"
                    defaultChecked={editingState ? editingState.is_active : true}
                    className="checkbox checkbox-primary checkbox-sm rounded-lg"
                  />
                  <span className="label-text text-xs font-semibold">
                    State is active and selectable by vendors
                  </span>
                </label>
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  onClick={() => setIsStateModalOpen(false)}
                  className="btn btn-ghost btn-sm rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary btn-sm rounded-xl text-white font-bold text-xs"
                >
                  {isLoading ? "Saving..." : editingState ? "Update State" : "Create State"}
                </button>
              </div>
            </form>
          </div>
          <div
            className="modal-backdrop bg-black/40"
            onClick={() => setIsStateModalOpen(false)}
          />
        </div>
      )}

      {/* Modal 2: City Upsert */}
      {isCityModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md rounded-2xl">
            <h3 className="font-black text-lg text-base-content flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              {editingCity ? "Edit City / Area" : "Add City / Area"}
            </h3>

            {errorMsg && (
              <div className="alert alert-error text-xs p-2 mt-3 rounded-xl">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCitySubmit} className="space-y-4 mt-4">
              {editingCity && (
                <input type="hidden" name="id" value={editingCity.id} />
              )}

              <div>
                <label className="label text-xs font-bold text-base-content/80 pb-1">
                  Parent State *
                </label>
                <select
                  name="state_id"
                  required
                  defaultValue={
                    editingCity?.state_id || activeState?.id || locations[0]?.id || ""
                  }
                  className="select select-bordered w-full rounded-xl text-sm"
                >
                  {locations.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label text-xs font-bold text-base-content/80 pb-1">
                  City / Area Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingCity?.name || ""}
                  placeholder="e.g. Yaba or Ikeja GRA"
                  className="input input-bordered w-full rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="label text-xs font-bold text-base-content/80 pb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  name="display_order"
                  defaultValue={editingCity?.display_order ?? 50}
                  className="input input-bordered w-full rounded-xl text-sm"
                />
              </div>

              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-3 py-1">
                  <input
                    type="checkbox"
                    name="is_active"
                    defaultChecked={editingCity ? editingCity.is_active : true}
                    className="checkbox checkbox-primary checkbox-sm rounded-lg"
                  />
                  <span className="label-text text-xs font-semibold">
                    Area is active and recommended in dropdowns
                  </span>
                </label>
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  onClick={() => setIsCityModalOpen(false)}
                  className="btn btn-ghost btn-sm rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary btn-sm rounded-xl text-white font-bold text-xs"
                >
                  {isLoading ? "Saving..." : editingCity ? "Update Area" : "Create Area"}
                </button>
              </div>
            </form>
          </div>
          <div
            className="modal-backdrop bg-black/40"
            onClick={() => setIsCityModalOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
