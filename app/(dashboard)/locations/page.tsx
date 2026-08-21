// app/(dashboard)/locations/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LocationItem,
  getLocations,
  getErrorMessage,
} from "@/service/locationService";
import LocationStatusBadge from "../_components/LocationStatusBadge";
import RoleGate from "../_components/RoleGate";

const STATUS_FILTERS: { label: string; value: "" | "true" | "false" }[] = [
  { label: "All", value: "" },
  { label: "Active", value: "true" },
  { label: "Inactive", value: "false" },
];

const PAGE_SIZE = 10;

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-LK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.3" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
      <PinIcon />
    </div>
  );
}

export default function LocationsPage() {
  const router = useRouter();

  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<"" | "true" | "false">("");
  const [searchInput, setSearchInput] = useState("");
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getLocations({
        searchText,
        isActive: statusFilter === "" ? undefined : statusFilter === "true",
        page,
        size: PAGE_SIZE,
      });
      setLocations(result.dataList ?? []);
      setCount(result.count ?? 0);
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't load locations. Please try again."));
      setLocations([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, [searchText, statusFilter, page]);

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
          <h1 className="text-xl font-bold text-text">Locations</h1>
          <p className="mt-1 text-sm text-subtle">Manage pickup and drop-off branches.</p>
        </div>
        <RoleGate allow={["STAFF", "ADMIN", "SUPER_ADMIN"]}>
          <Link
            href="/locations/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
          >
            <PlusIcon />
            New Location
          </Link>
        </RoleGate>
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
              placeholder="Search name, city, address..."
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

        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => {
                setStatusFilter(f.value);
                setPage(0);
              }}
              className="rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                backgroundColor: statusFilter === f.value ? "var(--color-primary)" : "var(--color-surface)",
                color: statusFilter === f.value ? "#fff" : "var(--color-subtle)",
                border: "1px solid var(--color-border)",
              }}
            >
              {f.label}
            </button>
          ))}
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
                <th className="px-5 py-3 font-medium">Location</th>
                <th className="px-5 py-3 font-medium">City</th>
                <th className="px-5 py-3 font-medium">Coordinates</th>
                <th className="px-5 py-3 font-medium">Bookings</th>
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

              {!loading && locations.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-subtle">
                    No locations found.
                  </td>
                </tr>
              )}

              {!loading &&
                locations.map((l) => (
                  <tr
                    key={l.id}
                    onClick={() => router.push(`/locations/${l.id}`)}
                    className="cursor-pointer transition-colors hover:bg-body"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <LocationIcon />
                        <div>
                          <p className="font-medium text-text">{l.locationName}</p>
                          <p className="max-w-xs truncate text-xs text-subtle">
                            {l.address || "No address on file"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-text">{l.city}</td>
                    <td className="px-5 py-4 text-text">
                      {l.latitude != null && l.longitude != null ? (
                        <span className="text-xs text-subtle">
                          {l.latitude.toFixed(4)}, {l.longitude.toFixed(4)}
                        </span>
                      ) : (
                        <span className="text-xs text-subtle">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-text">{l.totalBookingCount}</td>
                    <td className="px-5 py-4">
                      <LocationStatusBadge isActive={l.isActive} />
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
