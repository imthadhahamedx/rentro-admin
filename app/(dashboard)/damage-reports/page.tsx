// app/(dashboard)/damage-reports/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DamageReportListItem,
  DamageReportReviewedFilter,
  getDamageReports,
  getErrorMessage,
} from "@/service/damageReportService";

const REVIEW_FILTERS: { label: string; value: DamageReportReviewedFilter }[] = [
  { label: "All", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "Reviewed", value: "REVIEWED" },
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

function ReviewedBadge({ reviewed }: { reviewed: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        reviewed ? "bg-green-tint-10 text-green" : "bg-warning/10 text-warning"
      }`}
    >
      {reviewed ? "Reviewed" : "Pending"}
    </span>
  );
}

export default function DamageReportsPage() {
  const router = useRouter();

  const [records, setRecords] = useState<DamageReportListItem[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
  const [reviewed, setReviewed] = useState<DamageReportReviewedFilter>("");
  const [searchInput, setSearchInput] = useState("");
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getDamageReports({ searchText, reviewed, page, size: PAGE_SIZE });
      setRecords(result.dataList ?? []);
      setCount(result.count ?? 0);
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't load damage reports. Please try again."));
      setRecords([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, [searchText, reviewed, page]);

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
          <h1 className="text-xl font-bold text-text">Damage Reports</h1>
          <p className="mt-1 text-sm text-subtle">
            Booking-level damage report records linking a booking to a damage entry.
          </p>
        </div>
        <Link
          href="/damage-reports/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
        >
          <PlusIcon />
          New Report
        </Link>
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
              placeholder="Booking ref, customer, reg no..."
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
          {REVIEW_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => {
                setReviewed(f.value);
                setPage(0);
              }}
              className="rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                backgroundColor: reviewed === f.value ? "var(--color-primary)" : "var(--color-surface)",
                color: reviewed === f.value ? "#fff" : "var(--color-subtle)",
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
                <th className="px-5 py-3 font-medium">Vehicle / Damage</th>
                <th className="px-5 py-3 font-medium">Booking</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Reported By</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`skeleton-${i}`}>
                    <td colSpan={6} className="px-5 py-4">
                      <div className="h-4 w-full animate-pulse rounded bg-border" />
                    </td>
                  </tr>
                ))}

              {!loading && records.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-subtle">
                    No damage reports found.
                  </td>
                </tr>
              )}

              {!loading &&
                records.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => router.push(`/damage-reports/${r.id}`)}
                    className="cursor-pointer transition-colors hover:bg-body"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-body/50">
                          {r.primaryImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={r.primaryImageUrl}
                              alt={r.vehicleLabel}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6 text-subtle">
                              <path d="M12 3 2 20h20L12 3Z" />
                              <path d="M12 10v4M12 17h.01" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-text">{r.vehicleLabel}</p>
                          <p className="mt-0.5 line-clamp-1 max-w-[200px] text-xs text-subtle">
                            {r.damageDescription}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-text">{r.bookingRef}</p>
                      <p className="text-xs text-subtle">{r.vehicleRegNo}</p>
                    </td>
                    <td className="px-5 py-4 text-text">{r.customerName ?? "—"}</td>
                    <td className="px-5 py-4 text-text">{r.damageBy}</td>
                    <td className="px-5 py-4 text-subtle">{formatDate(r.date)}</td>
                    <td className="px-5 py-4">
                      <ReviewedBadge reviewed={r.reviewed} />
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
