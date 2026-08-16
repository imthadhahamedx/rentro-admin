// app/(dashboard)/bookings/[bookingId]/complete/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookingDetail,
  completeBooking,
  getBookingById,
  getErrorMessage,
} from "@/service/bookingService";
import BookingStatusBadge from "../../../_components/BookingStatusBadge";

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function formatCurrency(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-LK", { maximumFractionDigits: 0 })}`;
}

export default function CompleteBookingPage() {
  const params = useParams<{ bookingId: string }>();
  const router = useRouter();
  const bookingId = params.bookingId;

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [actualReturnDate, setActualReturnDate] = useState(todayISO());
  const [extraCharges, setExtraCharges] = useState("0");
  const [extraChargesNote, setExtraChargesNote] = useState("");
  const [currentMileageKm, setCurrentMileageKm] = useState("");

  useEffect(() => {
    let cancelled = false;
    getBookingById(bookingId)
      .then((data) => {
        if (!cancelled) setBooking(data);
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

  const extra = Number(extraCharges) || 0;
  const estimatedFinal = booking
    ? booking.totalAmount - booking.discountAmount + extra
    : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      setSubmitting(true);
      await completeBooking(bookingId, {
        actualReturnDate,
        extraCharges: extra,
        extraChargesNote: extraChargesNote.trim() || undefined,
        currentMileageKm: currentMileageKm ? Number(currentMileageKm) : undefined,
      });
      router.push(`/booking/${bookingId}`);
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't complete this booking."));
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-info focus:outline-none";
  const labelClass = "mb-1.5 block text-xs font-medium text-subtle";

  const disabled = loading || (booking ? booking.status !== "ACTIVE" : true);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link href={`/booking/${bookingId}`} className="text-xs font-medium text-info hover:underline">
        ← Back to booking
      </Link>

      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h1 className="text-lg font-bold text-text">Complete Booking (Vehicle Return)</h1>
        <p className="mt-1 text-sm text-subtle">
          Record the return details for this booking. The vehicle will be made available again.
        </p>

        {loading && <div className="mt-4 h-16 w-full animate-pulse rounded bg-border" />}

        {!loading && booking && (
          <div className="mt-4 rounded-lg border border-border bg-body/50 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium text-text">{booking.bookingRef}</span>
              <BookingStatusBadge status={booking.status} />
            </div>
            <p className="mt-1 text-subtle">
              {booking.vehicle.make} {booking.vehicle.model} ({booking.vehicle.regNo}) · Expected dropoff{" "}
              {new Date(booking.dropoffDate).toLocaleDateString("en-LK", { day: "2-digit", month: "short", year: "numeric" })}
            </p>
          </div>
        )}

        {!loading && booking && booking.status !== "ACTIVE" && (
          <div className="mt-4 rounded-lg border border-warning/20 bg-warning/10 px-4 py-3 text-sm text-warning">
            Only active bookings can be completed. This booking is currently {booking.status}.
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className={labelClass}>Actual Return Date *</label>
            <input
              type="date"
              value={actualReturnDate}
              onChange={(e) => setActualReturnDate(e.target.value)}
              className={inputClass}
              disabled={disabled}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Extra Charges</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={extraCharges}
                onChange={(e) => setExtraCharges(e.target.value)}
                className={inputClass}
                disabled={disabled}
              />
            </div>
            <div>
              <label className={labelClass}>Odometer Reading (km)</label>
              <input
                type="number"
                min={0}
                value={currentMileageKm}
                onChange={(e) => setCurrentMileageKm(e.target.value)}
                className={inputClass}
                disabled={disabled}
                placeholder="Optional"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Extra Charges Note</label>
            <textarea
              value={extraChargesNote}
              onChange={(e) => setExtraChargesNote(e.target.value)}
              rows={3}
              className={inputClass}
              disabled={disabled}
              placeholder="e.g. Late return fee, fuel top-up, minor scratch..."
            />
          </div>

          {booking && (
            <div className="rounded-lg border border-border bg-body/50 p-4 text-sm">
              <div className="flex justify-between text-subtle">
                <span>Rental total</span>
                <span>{formatCurrency(booking.totalAmount - booking.discountAmount)}</span>
              </div>
              <div className="mt-1 flex justify-between text-subtle">
                <span>Extra charges</span>
                <span>{formatCurrency(extra)}</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-semibold text-text">
                <span>Estimated final amount</span>
                <span>{formatCurrency(estimatedFinal)}</span>
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
              disabled={submitting || disabled}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Completing..." : "Complete — Vehicle Returned"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
