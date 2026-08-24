// app/(dashboard)/bookings/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookingListItem,
  getBookings,
  getErrorMessage,
} from "@/service/bookingService";
import BookingStatusBadge from "../_components/BookingStatusBadge";

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: "All", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "Active", value: "ACTIVE" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
  { label: "No Show", value: "NO_SHOW" },
];

const PAGE_SIZE = 10;

function formatCurrency(amount: number): string {
  return `Rs. ${amount?.toLocaleString("en-LK", { maximumFractionDigits: 0 })}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-LK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * The backend has occasionally been observed to return a malformed
 * shape for `dataList`, e.g. `[[]]` (an array wrapping an empty array)
 * instead of `[]` when there are no results. This guard normalizes any
 * such shape into a clean, safe array of real booking objects so the
 * table never renders a phantom row full of `undefined` fields.
 *
 * TODO: this is a workaround. The real fix belongs on the backend —
 * find where the bookings list response builds `{ count, dataList }`
 * and make sure `dataList` is the flat rows array, not an array
 * containing the rows array.
 */
function normalizeBookings(dataList: unknown): BookingListItem[] {
  if (!Array.isArray(dataList)) return [];

  // Flatten one level in case of [[...]] wrapping, then drop any
  // falsy/empty entries or entries missing a usable id.
  const flat = dataList.flat(1);

  return flat.filter(
      (item): item is BookingListItem =>
          !!item &&
          typeof item === "object" &&
          "id" in item &&
          item.id !== undefined &&
          item.id !== null
  );
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

export default function BookingsPage() {
  const router = useRouter();

  const [bookings, setBookings] = useState<BookingListItem[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getBookings({ searchText, status, page, size: PAGE_SIZE });

      const cleanBookings = normalizeBookings(result.dataList);
      setBookings(cleanBookings);

      // Trust the server-reported count only if it agrees with reality;
      // otherwise fall back to what we actually have, so pagination
      // ("Page X of Y") never looks inconsistent with the empty state.
      setCount(
          typeof result.count === "number" && result.count >= cleanBookings.length
              ? result.count
              : cleanBookings.length
      );
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't load bookings. Please try again."));
      setBookings([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, [searchText, status, page]);

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
            <h1 className="text-xl font-bold text-text">Bookings</h1>
            <p className="mt-1 text-sm text-subtle">
              Manage reservations from creation through return.
            </p>
          </div>
          <Link
              href="/booking/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
          >
            <PlusIcon />
            New Booking
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <form onSubmit={handleSearchSubmit} className="flex w-full max-w-sm items-center gap-2">
            <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle">
              <SearchIcon />
            </span>
              <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search ref, customer, vehicle..."
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
                <th className="px-5 py-3 font-medium">Booking</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Vehicle</th>
                <th className="px-5 py-3 font-medium">Dates</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Status</th>
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

              {!loading && bookings.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-sm text-subtle">
                      No bookings found.
                    </td>
                  </tr>
              )}

              {!loading &&
                  bookings.map((b) => (
                      <tr
                          key={b.id}
                          onClick={() => router.push(`/booking/${b.id}`)}
                          className="cursor-pointer transition-colors hover:bg-body"
                      >
                        <td className="px-5 py-4">
                          <p className="font-medium text-text">{b.bookingRef}</p>
                          <p className="text-xs text-subtle">{formatDate(b.createdAt)}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-text">{b.customerName}</p>
                          <p className="text-xs text-subtle">{b.customerPhone}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-text">{b.vehicleName}</p>
                          <p className="text-xs text-subtle">{b.regNo}</p>
                        </td>
                        <td className="px-5 py-4 text-text">
                          <p>{formatDate(b.pickupDate)}</p>
                          <p className="text-xs text-subtle">&rarr; {formatDate(b.dropoffDate)}</p>
                        </td>
                        <td className="px-5 py-4 font-medium text-text">
                          {formatCurrency(b.finalAmount ?? b.totalAmount)}
                        </td>
                        <td className="px-5 py-4">
                          <BookingStatusBadge status={b.status} />
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