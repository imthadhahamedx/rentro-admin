// app/(dashboard)/vehicles/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  VehicleListItem,
  VehicleCategory,
  getVehicles,
  getAllVehicleCategoryOptions,
  getErrorMessage,
} from "@/service/vehicleService";
import VehicleStatusBadge from "../_components/VehicleStatusBadge";
import RoleGate from "../_components/RoleGate";

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: "All", value: "" },
  { label: "Available", value: "AVAILABLE" },
  { label: "Rented", value: "RENTED" },
  { label: "Maintenance", value: "MAINTENANCE" },
  { label: "Inactive", value: "INACTIVE" },
];

const PAGE_SIZE = 10;

function formatCurrency(amount: number): string {
  return `Rs. ${amount?.toLocaleString("en-LK", { maximumFractionDigits: 0 })}`;
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3-3" />
    </svg>
  );
}

function CarPlaceholderIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6 text-subtle">
      <path d="M3 13l1.5-4.5A2 2 0 0 1 6.4 7h11.2a2 2 0 0 1 1.9 1.5L21 13" />
      <path d="M3 13h18v4a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H6v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4Z" />
      <circle cx="7.5" cy="17.5" r="1.5" />
      <circle cx="16.5" cy="17.5" r="1.5" />
    </svg>
  );
}

export default function VehiclesPage() {
  const router = useRouter();

  const [vehicles, setVehicles] = useState<VehicleListItem[]>([]);
  const [categories, setCategories] = useState<VehicleCategory[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAllVehicleCategoryOptions()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getVehicles({ searchText, status, categoryId, page, size: PAGE_SIZE });
      setVehicles(result.dataList ?? []);
      setCount(result.count ?? 0);
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't load vehicles. Please try again."));
      setVehicles([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, [searchText, status, categoryId, page]);

  useEffect(() => {
    load();
  }, [load]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(0);
    setSearchText(searchInput.trim());
  }

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-text">Vehicles</h1>
          <p className="mt-1 text-sm text-subtle">Manage the fleet, availability, and pricing.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/vehicles/categories"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text hover:bg-body"
          >
            Categories
          </Link>
          <RoleGate allow={["STAFF", "ADMIN", "SUPER_ADMIN"]}>
            <Link
              href="/vehicles/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
            >
              <PlusIcon />
              New Vehicle
            </Link>
          </RoleGate>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <form onSubmit={handleSearchSubmit} className="flex w-full max-w-sm items-center gap-2">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle">
              <SearchIcon />
            </span>
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search make, model, reg no..."
              className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm text-text placeholder:text-subtle focus:border-info focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-text hover:bg-body"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setPage(0);
            }}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-info focus:outline-none"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.category}
              </option>
            ))}
          </select>

          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => {
                  setStatus(f.value);
                  setPage(0);
                }}
                className="rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
                style={{
                  backgroundColor: status === f.value ? "var(--color-primary)" : "var(--color-surface)",
                  color: status === f.value ? "#fff" : "var(--color-subtle)",
                  border: "1px solid var(--color-border)",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-danger/20 bg-danger-tint-6 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-body/50 text-xs uppercase tracking-wide text-subtle">
              <tr>
                <th className="px-5 py-3 font-medium">Vehicle</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Transmission / Fuel</th>
                <th className="px-5 py-3 font-medium">Daily Rate</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`skeleton-${i}`}>
                    <td colSpan={5} className="px-5 py-4">
                      <div className="h-4 w-full animate-pulse rounded bg-border" />
                    </td>
                  </tr>
                ))}

              {!loading && vehicles.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-subtle">
                    No vehicles found.
                  </td>
                </tr>
              )}

              {!loading &&
                vehicles.map((v) => (
                  <tr
                    key={v.id}
                    onClick={() => router.push(`/vehicles/${v.id}`)}
                    className="cursor-pointer transition-colors hover:bg-body"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-body/50">
                          {v.primaryImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={v.primaryImageUrl} alt={`${v.make} ${v.model}`} className="h-full w-full object-cover" />
                          ) : (
                            <CarPlaceholderIcon />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-text">
                            {v.make} {v.model} <span className="text-subtle">({v.modelYear})</span>
                          </p>
                          <p className="text-xs text-subtle">{v.regNo} · {v.colour}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-text">{v.categoryName}</td>
                    <td className="px-5 py-4 text-text">
                      <p>{v.transmission}</p>
                      <p className="text-xs text-subtle">{v.fuelType}</p>
                    </td>
                    <td className="px-5 py-4 font-medium text-text">{formatCurrency(v.dailyRate)}/day</td>
                    <td className="px-5 py-4">
                      <VehicleStatusBadge status={v.status} />
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
