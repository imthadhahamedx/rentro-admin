// app/(dashboard)/vehicles/categories/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  VehicleCategory,
  getVehicleCategories,
  createVehicleCategory,
  updateVehicleCategory,
  deleteVehicleCategory,
  getErrorMessage,
} from "@/service/vehicleService";
import RoleGate from "../../_components/RoleGate";

const PAGE_SIZE = 10;

const EMPTY_FORM = { category: "", description: "", iconName: "" };

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3-3" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export default function VehicleCategoriesPage() {
  const [categories, setCategories] = useState<VehicleCategory[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getVehicleCategories({ searchText, page, size: PAGE_SIZE });
      setCategories(result.dataList ?? []);
      setCount(result.count ?? 0);
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't load categories. Please try again."));
      setCategories([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, [searchText, page]);

  useEffect(() => {
    load();
  }, [load]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(0);
    setSearchText(searchInput.trim());
  }

  function openCreateForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowForm(true);
  }

  function openEditForm(cat: VehicleCategory) {
    setEditingId(cat.id);
    setForm({ category: cat.category, description: cat.description, iconName: cat.iconName });
    setFormError(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!form.category.trim() || !form.description.trim() || !form.iconName.trim()) {
      setFormError("Please fill in all fields.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        category: form.category.trim(),
        description: form.description.trim(),
        iconName: form.iconName.trim(),
      };
      if (editingId) {
        await updateVehicleCategory(editingId, payload);
      } else {
        await createVehicleCategory(payload);
      }
      closeForm();
      await load();
    } catch (err) {
      setFormError(getErrorMessage(err, "Couldn't save this category."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      setDeletingId(id);
      setDeleteError(null);
      await deleteVehicleCategory(id);
      setConfirmDeleteId(null);
      await load();
    } catch (err) {
      setDeleteError(getErrorMessage(err, "Couldn't delete this category. It may still have vehicles assigned."));
    } finally {
      setDeletingId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const inputClass =
    "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-info focus:outline-none disabled:opacity-60";
  const labelClass = "mb-1.5 block text-xs font-medium text-subtle";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/vehicles" className="text-xs font-medium text-info hover:underline">
            ← Back to vehicles
          </Link>
          <h1 className="mt-2 text-xl font-bold text-text">Vehicle Categories</h1>
          <p className="mt-1 text-sm text-subtle">Organize the fleet into categories (Economy, SUV, Luxury, etc).</p>
        </div>
        <RoleGate allow={["STAFF", "ADMIN", "SUPER_ADMIN"]}>
          <button
            onClick={openCreateForm}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
          >
            <PlusIcon />
            New Category
          </button>
        </RoleGate>
      </div>

      <form onSubmit={handleSearchSubmit} className="flex w-full max-w-sm items-center gap-2">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle">
            <SearchIcon />
          </span>
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search categories..."
            className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm text-text placeholder:text-subtle focus:border-info focus:outline-none"
          />
        </div>
        <button type="submit" className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-text hover:bg-body">
          Search
        </button>
      </form>

      {error && (
        <div className="rounded-lg border border-danger/20 bg-danger-tint-6 px-4 py-3 text-sm text-danger">{error}</div>
      )}
      {deleteError && (
        <div className="rounded-lg border border-danger/20 bg-danger-tint-6 px-4 py-3 text-sm text-danger">{deleteError}</div>
      )}

      {/* Create / edit form */}
      {showForm && (
        <RoleGate allow={["STAFF", "ADMIN", "SUPER_ADMIN"]}>
          <form onSubmit={handleFormSubmit} className="space-y-4 rounded-xl border border-border bg-surface p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-text">{editingId ? "Edit Category" : "New Category"}</h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Category Name *</label>
                <input
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className={inputClass}
                  placeholder="SUV"
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Icon Name *</label>
                <input
                  value={form.iconName}
                  onChange={(e) => setForm((f) => ({ ...f, iconName: e.target.value }))}
                  className={inputClass}
                  placeholder="suv-icon"
                  required
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Description *</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className={inputClass}
                placeholder="Spacious vehicles suited for families and groups..."
                required
              />
            </div>

            {formError && (
              <div className="rounded-lg border border-danger/20 bg-danger-tint-6 px-4 py-3 text-sm text-danger">{formError}</div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text hover:bg-body"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Saving..." : editingId ? "Save Changes" : "Create Category"}
              </button>
            </div>
          </form>
        </RoleGate>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-body/50 text-xs uppercase tracking-wide text-subtle">
              <tr>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Description</th>
                <th className="px-5 py-3 font-medium">Vehicles</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skeleton-${i}`}>
                    <td colSpan={4} className="px-5 py-4">
                      <div className="h-4 w-full animate-pulse rounded bg-border" />
                    </td>
                  </tr>
                ))}

              {!loading && categories.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-sm text-subtle">
                    No categories found.
                  </td>
                </tr>
              )}

              {!loading &&
                categories.map((cat) => (
                  <tr key={cat.id} className="transition-colors hover:bg-body">
                    <td className="px-5 py-4 font-medium text-text">{cat.category}</td>
                    <td className="max-w-md px-5 py-4 text-subtle">{cat.description}</td>
                    <td className="px-5 py-4 text-text">{cat.vehicleCount}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <RoleGate allow={["STAFF", "ADMIN", "SUPER_ADMIN"]}>
                          <button
                            onClick={() => openEditForm(cat)}
                            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text hover:bg-body"
                          >
                            Edit
                          </button>
                        </RoleGate>
                        <RoleGate allow={["SUPER_ADMIN"]}>
                          {confirmDeleteId === cat.id ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleDelete(cat.id)}
                                disabled={deletingId === cat.id}
                                className="rounded-lg bg-danger px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
                              >
                                {deletingId === cat.id ? "Deleting..." : "Confirm"}
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text hover:bg-body"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(cat.id)}
                              className="rounded-lg border border-danger/30 px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger-tint-6"
                            >
                              Delete
                            </button>
                          )}
                        </RoleGate>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <p className="text-xs text-subtle">
            {count === 0 ? "0 results" : `Page ${page + 1} of ${totalPages} · ${count} results`}
          </p>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text disabled:cursor-not-allowed disabled:opacity-40 hover:bg-body"
            >
              Previous
            </button>
            <button
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text disabled:cursor-not-allowed disabled:opacity-40 hover:bg-body"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
