// app/(dashboard)/bookings/[bookingId]/confirm/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookingDetail,
  confirmBooking,
  getBookingById,
  getErrorMessage,
} from "@/service/bookingService";
import BookingStatusBadge from "../../../_components/BookingStatusBadge";

export default function ConfirmBookingPage() {
  const params = useParams<{ bookingId: string }>();
  const router = useRouter();
  const bookingId = params.bookingId;

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function handleConfirm() {
    try {
      setSubmitting(true);
      setError(null);
      await confirmBooking(bookingId);
      router.push(`/booking/${bookingId}`);
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't confirm this booking."));
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link href={`/booking/${bookingId}`} className="text-xs font-medium text-info hover:underline">
        ← Back to booking
      </Link>

      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h1 className="text-lg font-bold text-text">Confirm Booking</h1>
        <p className="mt-1 text-sm text-subtle">
          Confirming marks this reservation as ready for pickup. This should be done once payment
          and documents have been verified.
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

        {!loading && booking && booking.status !== "PENDING" && (
          <div className="mt-4 rounded-lg border border-warning/20 bg-warning/10 px-4 py-3 text-sm text-warning">
            Only pending bookings can be confirmed. This booking is currently {booking.status}.
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg border border-danger/20 bg-danger-tint-6 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <Link
            href={`/booking/${bookingId}`}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text hover:bg-body"
          >
            Cancel
          </Link>
          <button
            onClick={handleConfirm}
            disabled={submitting || loading || (booking ? booking.status !== "PENDING" : true)}
            className="rounded-lg bg-info px-4 py-2 text-sm font-medium text-white hover:bg-info-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Confirming..." : "Confirm Booking"}
          </button>
        </div>
      </div>
    </div>
  );
}
