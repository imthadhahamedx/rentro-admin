// app/(dashboard)/bookings/[bookingId]/notes/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookingDetail,
  getBookingById,
  getErrorMessage,
  updateBookingNotes,
} from "@/service/bookingService";
import BookingStatusBadge from "../../../_components/BookingStatusBadge";

export default function BookingNotesPage() {
  const params = useParams<{ bookingId: string }>();
  const router = useRouter();
  const bookingId = params.bookingId;

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    let cancelled = false;
    getBookingById(bookingId)
      .then((data) => {
        if (!cancelled) {
          setBooking(data);
          setNotes(data.notes ?? "");
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      setSubmitting(true);
      await updateBookingNotes(bookingId, { notes });
      router.push(`/booking/${bookingId}`);
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't save these notes."));
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link href={`/booking/${bookingId}`} className="text-xs font-medium text-info hover:underline">
        ← Back to booking
      </Link>

      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h1 className="text-lg font-bold text-text">Edit Notes</h1>
        <p className="mt-1 text-sm text-subtle">
          Internal notes for staff — not visible to the customer.
        </p>

        {loading && <div className="mt-4 h-16 w-full animate-pulse rounded bg-border" />}

        {!loading && booking && (
          <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-body/50 p-4 text-sm">
            <span className="font-medium text-text">{booking.bookingRef}</span>
            <BookingStatusBadge status={booking.status} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-subtle">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
              disabled={loading}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-info focus:outline-none"
              placeholder="Add any internal notes about this booking..."
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
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || loading}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save Notes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
