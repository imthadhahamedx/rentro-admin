// app/(dashboard)/customers/[customerId]/bookings/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { BookingListItem } from "@/service/bookingService";
import { CustomerDetail, getCustomerById, getCustomerBookings, getErrorMessage } from "@/service/customerService";
import BookingStatusBadge from "../../../_components/BookingStatusBadge";

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

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-LK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(amount: number | null | undefined): string {
  return `Rs. ${(amount ?? 0).toLocaleString("en-LK", { maximumFractionDigits: 0 })}`;
}

export default function CustomerBookingsPage() {
  const params = useParams<{ customerId: string }>();
  const router = useRouter();
  const customerId = params.customerId;

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [bookings, setBookings] = useState<BookingListItem[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCustomerById(customerId)
      .then(setCustomer)
      .catch(() => setCustomer(null));
  }, [customerId]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getCustomerBookings(customerId, { status, page, size: PAGE_SIZE });
      setBookings(result.dataList ?? []);
      setCount(result.count ?? 0);
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't load booking history. Please try again."));
      setBookings([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, [customerId, status, page]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href={`/customers/${customerId}`} className="text-xs font-medium text-info hover:underline">
          ← Back to customer
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-text">
              Booking History{customer ? ` — ${customer.fullName}` : ""}
            </h1>
            <p className="mt-1 text-sm text-subtle">All rentals made by this customer.</p>
          </div>
        </div>
      </div>

      {/* Filters */}
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
                <th className="px-5 py-3 font-medium">Booking Ref</th>
                <th className="px-5 py-3 font-medium">Vehicle</th>
                <th className="px-5 py-3 font-medium">Pickup / Dropoff</th>
                <th className="px-5 py-3 font-medium">Dates</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skeleton-${i}`}>
                    <td colSpan={6} className="px-5 py-4">
                      <div className="h-4 w-full animate-pulse rounded bg-border" />
                    </td>
                  </tr>
                ))}

              {!loading && bookings.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-subtle">
                    No bookings found for this customer.
                  </td>
                </tr>
              )}

              {!loading &&
                bookings.map((b) => (
                  <tr
                    key={b.id}
                    onClick={() => router.push(`/bookings/${b.id}`)}
                    className="cursor-pointer transition-colors hover:bg-body"
                  >
                    <td className="px-5 py-4 font-medium text-text">{b.bookingRef}</td>
                    <td className="px-5 py-4 text-text">
                      <p>{b.vehicleName}</p>
                      <p className="text-xs text-subtle">{b.regNo}</p>
                    </td>
                    <td className="px-5 py-4 text-text">
                      <p>{b.pickupLocationName}</p>
                      <p className="text-xs text-subtle">→ {b.dropoffLocationName}</p>
                    </td>
                    <td className="px-5 py-4 text-text">
                      <p>{formatDate(b.pickupDate)}</p>
                      <p className="text-xs text-subtle">→ {formatDate(b.dropoffDate)}</p>
                    </td>
                    <td className="px-5 py-4 font-medium text-text">{formatCurrency(b.finalAmount ?? b.totalAmount)}</td>
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
