// app/(dashboard)/bookings/[bookingId]/cancel/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookingDetail,
  cancelBooking,
  getBookingById,
  getErrorMessage,
} from "@/service/bookingService";
import BookingStatusBadge from "../../../_components/BookingStatusBadge";

export default function CancelBookingPage() {
  const params = useParams<{ bookingId: string }>();
  const router = useRouter();
  const bookingId = params.bookingId;

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");

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

  const disabled =
    loading || (booking ? !["PENDING", "CONFIRMED"].includes(booking.status) : true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!reason.trim()) {
      setError("Please provide a cancellation reason.");
      return;
    }
    try {
      setSubmitting(true);
      await cancelBooking(bookingId, { reason: reason.trim() });
      router.push(`/booking/${bookingId}`);
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't cancel this booking."));
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link href={`/booking/${bookingId}`} className="text-xs font-medium text-info hover:underline">
        ← Back to booking
      </Link>

      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h1 className="text-lg font-bold text-text">Cancel Booking</h1>
        <p className="mt-1 text-sm text-subtle">
          Cancelling releases the vehicle for the reserved dates. This action cannot be undone.
        </p>

        {loading && <div className="mt-4 h-16 w-full animate-pulse rounded bg-border" />}

        {!loading && booking && (
          <div className="mt-4 rounded-lg border border-border bg-body/50 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium text-text">{booking.bookingRef}</span>
              <BookingStatusBadge status={booking.status} />
            </div>
            <p className="mt-1 text-subtle">
              {booking.customer.fullName} · {booking.vehicle.make} {booking.vehicle.model} ({booking.vehicle.regNo})
            </p>
          </div>
        )}

        {!loading && booking && disabled && (
          <div className="mt-4 rounded-lg border border-warning/20 bg-warning/10 px-4 py-3 text-sm text-warning">
            Only pending or confirmed bookings can be cancelled. This booking is currently {booking.status}.
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-subtle">
              Cancellation Reason *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              disabled={disabled}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-info focus:outline-none"
              placeholder="e.g. Customer requested cancellation, duplicate booking..."
              required
            />
          </div>

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
              Back
            </Link>
            <button
              type="submit"
              disabled={submitting || disabled}
              className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Cancelling..." : "Cancel Booking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
