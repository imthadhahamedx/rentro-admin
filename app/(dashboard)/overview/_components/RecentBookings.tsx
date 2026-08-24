// app/(dashboard)/overview/_components/RecentBookings.tsx
// Shows the latest bookings (fixed last 5, from GET /dashboard/overview).

import Link from "next/link";
import { RecentBooking } from "@/service/dashboardService";
import BookingStatusBadge from "@/app/(dashboard)/_components/BookingStatusBadge";

interface RecentBookingsProps {
  bookings: RecentBooking[];
  loading?: boolean;
}

function formatCurrency(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-LK", { maximumFractionDigits: 0 })}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-LK", {
    day: "2-digit",
    month: "short",
  });
}

export default function RecentBookings({ bookings, loading = false }: RecentBookingsProps) {
  return (
    <div className="rounded-xl border border-border bg-surface shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h3 className="text-sm font-semibold text-text">Recent Bookings</h3>
        <Link
          href="/booking"
          className="text-xs font-medium text-info hover:underline"
        >
          View all
        </Link>
      </div>

      <div className="divide-y divide-border">
        {loading &&
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-4">
              <div className="w-2/3 space-y-2">
                <div className="h-3.5 w-32 animate-pulse rounded bg-border" />
                <div className="h-3 w-24 animate-pulse rounded bg-border" />
              </div>
              <div className="h-5 w-16 animate-pulse rounded-full bg-border" />
            </div>
          ))}

        {!loading && bookings.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-subtle">
            No bookings yet.
          </p>
        )}

        {!loading &&
          bookings.map((booking) => (
            <Link
              key={booking.id}
              href={`/booking/${booking.id}`}
              className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-body"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-text">
                  {booking.customerName}
                </p>
                <p className="truncate text-xs text-subtle">
                  {booking.vehicleName} &middot; {booking.bookingRef}
                </p>
                <p className="mt-0.5 text-xs text-subtle">
                  {formatDate(booking.pickupDate)} → {formatDate(booking.dropoffDate)}
                </p>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <BookingStatusBadge status={booking.status} />
                <span className="text-xs font-semibold text-text">
                  {formatCurrency(booking.totalAmount)}
                </span>
              </div>
            </Link>
          ))}
      </div>
    </div>
  );
}
