// app/(dashboard)/bookings/[bookingId]/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookingDetail,
  getBookingById,
  getErrorMessage,
} from "@/service/bookingService";
import BookingStatusBadge from "../../_components/BookingStatusBadge";

function formatCurrency(amount: number | null | undefined): string {
  return `Rs. ${(amount ?? 0).toLocaleString("en-LK", { maximumFractionDigits: 0 })}`;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-LK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-LK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-text">{title}</h3>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-subtle">{label}</span>
      <span className="font-medium text-text">{value}</span>
    </div>
  );
}

export default function BookingDetailPage() {
  const params = useParams<{ bookingId: string }>();
  const router = useRouter();
  const bookingId = params.bookingId;

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getBookingById(bookingId);
      setBooking(data);
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't load this booking."));
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-48 animate-pulse rounded bg-border" />
        <div className="h-40 w-full animate-pulse rounded-xl bg-border" />
        <div className="h-40 w-full animate-pulse rounded-xl bg-border" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="space-y-4">
        <Link href="/booking" className="text-xs font-medium text-info hover:underline">
          ← Back to booking
        </Link>
        <div className="rounded-lg border border-danger/20 bg-danger-tint-6 px-4 py-3 text-sm text-danger">
          {error ?? "Booking not found."}
        </div>
      </div>
    );
  }

  const status = booking.status;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/booking" className="text-xs font-medium text-info hover:underline">
          ← Back to booking
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-text">{booking.bookingRef}</h1>
            <BookingStatusBadge status={status} />
          </div>

          {/* Action buttons based on current status */}
          <div className="flex flex-wrap gap-2">
            {status === "PENDING" && (
              <>
                <Link
                  href={`/booking/${booking.id}/confirm`}
                  className="rounded-lg bg-info px-3 py-2 text-xs font-medium text-white hover:bg-info-hover"
                >
                  Confirm
                </Link>
                <Link
                  href={`/booking/${booking.id}/cancel`}
                  className="rounded-lg border border-danger/30 px-3 py-2 text-xs font-medium text-danger hover:bg-danger-tint-6"
                >
                  Cancel
                </Link>
              </>
            )}
            {status === "CONFIRMED" && (
              <>
                <Link
                  href={`/booking/${booking.id}/activate`}
                  className="rounded-lg bg-green px-3 py-2 text-xs font-medium text-white hover:opacity-90"
                >
                  Activate (Pickup)
                </Link>
                <Link
                  href={`/booking/${booking.id}/cancel`}
                  className="rounded-lg border border-danger/30 px-3 py-2 text-xs font-medium text-danger hover:bg-danger-tint-6"
                >
                  Cancel
                </Link>
              </>
            )}
            {status === "ACTIVE" && (
              <>
                <Link
                  href={`/booking/${booking.id}/extension`}
                  className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-text hover:bg-body"
                >
                  Extend
                </Link>
                <Link
                  href={`/booking/${booking.id}/complete`}
                  className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white hover:opacity-90"
                >
                  Complete (Return)
                </Link>
              </>
            )}
            <Link
              href={`/booking/${booking.id}/notes`}
              className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-text hover:bg-body"
            >
              Edit Notes
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          <SectionCard title="Rental Period">
            <Row label="Pickup Date" value={formatDate(booking.pickupDate)} />
            <Row label="Dropoff Date" value={formatDate(booking.dropoffDate)} />
            <Row label="Actual Return" value={formatDate(booking.actualReturnDate)} />
            <Row label="Total Days" value={booking.totalDays} />
            <Row label="Pickup Location" value={`${booking.pickupLocation.locationName} — ${booking.pickupLocation.city}`} />
            <Row label="Dropoff Location" value={`${booking.dropoffLocation.locationName} — ${booking.dropoffLocation.city}`} />
          </SectionCard>

          <SectionCard title="Customer">
            <Row label="Name" value={booking.customer.fullName} />
            <Row label="Phone" value={booking.customer.phone} />
            <Row label="Email" value={booking.customer.email} />
            <Row label="NIC" value={booking.customer.nic} />
            <Row label="Driving License" value={booking.customer.drivingLicenseNo} />
            <Row label="License Expiry" value={formatDate(booking.customer.licenseExpiryDate)} />
          </SectionCard>

          <SectionCard title="Vehicle">
            <Row label="Vehicle" value={`${booking.vehicle.make} ${booking.vehicle.model} (${booking.vehicle.modelYear})`} />
            <Row label="Reg No" value={booking.vehicle.regNo} />
            <Row label="Category" value={booking.vehicle.categoryName} />
            <Row label="Colour" value={booking.vehicle.colour} />
            <Row label="Daily Rate" value={formatCurrency(booking.vehicle.dailyRate)} />
            <Row label="Current Status" value={booking.vehicle.status} />
          </SectionCard>

          {booking.extension && (
            <SectionCard title="Extension">
              <Row label="Original Dropoff" value={formatDate(booking.extension.originalDropoffDate)} />
              <Row label="New Dropoff" value={formatDate(booking.extension.newDropoffDate)} />
              <Row label="Additional Days" value={booking.extension.additionalDays} />
              <Row label="Additional Amount" value={formatCurrency(booking.extension.additionalAmount)} />
              <Row label="Reason" value={booking.extension.reason ?? "—"} />
              <Row label="Approved By" value={booking.extension.approvedByName ?? "—"} />
            </SectionCard>
          )}

          {booking.notes && (
            <SectionCard title="Notes">
              <p className="whitespace-pre-wrap text-sm text-text">{booking.notes}</p>
            </SectionCard>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <SectionCard title="Billing Summary">
            <Row label="Daily Rate" value={formatCurrency(booking.dailyRate)} />
            <Row label="Total Amount" value={formatCurrency(booking.totalAmount)} />
            <Row label="Discount" value={`- ${formatCurrency(booking.discountAmount)}`} />
            <Row label="Extra Charges" value={formatCurrency(booking.extraCharges)} />
            {booking.extraChargesNote && (
              <p className="mt-1 text-xs text-subtle">{booking.extraChargesNote}</p>
            )}
            <div className="my-2 border-t border-border" />
            <Row label="Final Amount" value={formatCurrency(booking.finalAmount)} />
            <Row label="Total Paid" value={formatCurrency(booking.totalPaid)} />
            <Row
              label="Balance Due"
              value={
                <span className={booking.balanceDue > 0 ? "text-danger" : "text-green"}>
                  {formatCurrency(booking.balanceDue)}
                </span>
              }
            />
          </SectionCard>

          <SectionCard title="Activity">
            <Row label="Created By" value={booking.createdByName ?? "—"} />
            <Row label="Created At" value={formatDateTime(booking.createdAt)} />
            <Row label="Approved By" value={booking.approvedByName ?? "—"} />
            <Row label="Last Updated" value={formatDateTime(booking.updatedAt)} />
            <Row label="Payments" value={booking.paymentsCount} />
            <Row label="Damage Reports" value={booking.damageReportsCount} />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
