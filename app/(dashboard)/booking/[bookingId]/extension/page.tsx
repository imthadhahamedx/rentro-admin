// app/(dashboard)/bookings/[bookingId]/extension/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookingDetail,
  extendBooking,
  getBookingById,
  getErrorMessage,
} from "@/service/bookingService";
import BookingStatusBadge from "../../../_components/BookingStatusBadge";

function addDaysISO(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function daysBetween(a: string, b: string): number {
  const d1 = new Date(a);
  const d2 = new Date(b);
  return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

function formatCurrency(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-LK", { maximumFractionDigits: 0 })}`;
}

export default function ExtendBookingPage() {
  const params = useParams<{ bookingId: string }>();
  const router = useRouter();
  const bookingId = params.bookingId;

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newDropoffDate, setNewDropoffDate] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    let cancelled = false;
    getBookingById(bookingId)
      .then((data) => {
        if (!cancelled) {
          setBooking(data);
          setNewDropoffDate(addDaysISO(data.dropoffDate, 1));
        }
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  const additionalDays = useMemo(() => {
    if (!booking || !newDropoffDate) return 0;
    return Math.max(0, daysBetween(booking.dropoffDate, newDropoffDate));
  }, [booking, newDropoffDate]);

  const additionalAmount = booking ? additionalDays * booking.dailyRate : 0;

  const disabled = loading || (booking ? booking.status !== "ACTIVE" : true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!booking) return;
    if (!(newDropoffDate > booking.dropoffDate)) {
      setError("New dropoff date must be after the current dropoff date.");
      return;
    }
    try {
      setSubmitting(true);
      await extendBooking(bookingId, {
        newDropoffDate,
        reason: reason.trim() || undefined,
      });
      router.push(`/booking/${bookingId}`);
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't extend this booking."));
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-info focus:outline-none";
  const labelClass = "mb-1.5 block text-xs font-medium text-subtle";

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link href={`/booking/${bookingId}`} className="text-xs font-medium text-info hover:underline">
        ← Back to booking
      </Link>

      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h1 className="text-lg font-bold text-text">Extend Booking</h1>
        <p className="mt-1 text-sm text-subtle">
          Push out the dropoff date for an active rental and charge the additional days.
        </p>

        {loading && <div className="mt-4 h-16 w-full animate-pulse rounded bg-border" />}

        {!loading && booking && (
          <div className="mt-4 rounded-lg border border-border bg-body/50 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium text-text">{booking.bookingRef}</span>
              <BookingStatusBadge status={booking.status} />
            </div>
            <p className="mt-1 text-subtle">
              Current dropoff: {new Date(booking.dropoffDate).toLocaleDateString("en-LK", { day: "2-digit", month: "short", year: "numeric" })}
            </p>
          </div>
        )}

        {!loading && booking && disabled && (
          <div className="mt-4 rounded-lg border border-warning/20 bg-warning/10 px-4 py-3 text-sm text-warning">
            Only active bookings can be extended. This booking is currently {booking.status}.
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className={labelClass}>New Dropoff Date *</label>
            <input
              type="date"
              value={newDropoffDate}
              min={booking ? addDaysISO(booking.dropoffDate, 1) : undefined}
              onChange={(e) => setNewDropoffDate(e.target.value)}
              className={inputClass}
              disabled={disabled}
              required
            />
          </div>

          <div>
            <label className={labelClass}>Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              disabled={disabled}
              className={inputClass}
              placeholder="e.g. Customer requested a few extra days..."
            />
          </div>

          {booking && (
            <div className="rounded-lg border border-border bg-body/50 p-4 text-sm">
              <div className="flex justify-between text-subtle">
                <span>{additionalDays} additional day(s) × {formatCurrency(booking.dailyRate)}</span>
                <span>{formatCurrency(additionalAmount)}</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-semibold text-text">
                <span>Additional charge</span>
                <span>{formatCurrency(additionalAmount)}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-danger/20 bg-danger-tint-6 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Link
              href={`/booking/${bookingId}`}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text hover:bg-body"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || disabled || additionalDays <= 0}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Extending..." : "Extend Booking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
