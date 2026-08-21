// app/(dashboard)/damage-reports/new/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createDamageReport, getErrorMessage } from "@/service/damageReportService";
import { getDamages, DamageListItem } from "@/service/damageService";
import apiClient from "@/lib/axios";

// Minimal booking option type — matches BookingListItemDTO fields
interface BookingOption {
  id: string;
  bookingRef: string;
  customerName: string;
  vehicleLabel: string;
  status: string;
}

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-info focus:outline-none disabled:opacity-60";
const labelClass = "mb-1.5 block text-xs font-medium text-subtle";

export default function NewDamageReportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preBookingId = searchParams.get("bookingId") ?? "";
  const preDamageId = searchParams.get("damageId") ?? "";

  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingOptions, setBookingOptions] = useState<BookingOption[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  const [bookingId, setBookingId] = useState(preBookingId);
  const [damageId, setDamageId] = useState(preDamageId);

  const [damageOptions, setDamageOptions] = useState<DamageListItem[]>([]);
  const [loadingDamages, setLoadingDamages] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load bookings via search
  useEffect(() => {
    let cancelled = false;
    async function loadBookings() {
      try {
        setLoadingBookings(true);
        const res = await apiClient.get("/booking", {
          params: { searchText: bookingSearch, page: 0, size: 50 },
        });
        if (!cancelled) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const dataList: any[] = res.data?.data?.dataList ?? [];
          setBookingOptions(
            dataList.map((b) => ({
              id: String(b.id),
              bookingRef: b.bookingRef ?? "",
              customerName: b.customerName ?? "—",
              vehicleLabel: b.vehicleName
                ? `${b.vehicleName} (${b.regNo ?? ""})`
                : "—",
              status: b.status ?? "",
            }))
          );
        }
      } finally {
        if (!cancelled) setLoadingBookings(false);
      }
    }
    loadBookings();
    return () => {
      cancelled = true;
    };
  }, [bookingSearch]);

  // When booking changes, fetch full booking detail to get vehicleId, then load damages
  useEffect(() => {
    if (!bookingId) {
      setDamageOptions([]);
      return;
    }

    let cancelled = false;
    async function loadDamages() {
      try {
        setLoadingDamages(true);
        // Fetch booking detail to get the nested vehicle.id
        const detailRes = await apiClient.get(`/booking/${bookingId}`);
        const vehicleId: string | undefined = detailRes.data?.data?.vehicle?.id;
        if (!vehicleId || cancelled) return;

        const result = await getDamages({ vehicleId, page: 0, size: 100 });
        if (!cancelled) setDamageOptions(result.dataList ?? []);
      } finally {
        if (!cancelled) setLoadingDamages(false);
      }
    }
    loadDamages();
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!bookingId || !damageId) {
      setError("Please select both a booking and a damage record.");
      return;
    }
    try {
      setSubmitting(true);
      const report = await createDamageReport({ bookingId, damageId });
      router.push(`/damage-reports/${report.id}`);
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't create the damage report. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/damage-reports" className="text-xs font-medium text-info hover:underline">
          ← Back to damage reports
        </Link>
        <h1 className="mt-2 text-xl font-bold text-text">New Damage Report</h1>
        <p className="mt-1 text-sm text-subtle">
          Link a booking to an existing damage record for that vehicle.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border border-border bg-surface p-6 shadow-sm"
      >
        {/* Booking search + select */}
        <div>
          <label className={labelClass}>Search Booking</label>
          <input
            type="text"
            value={bookingSearch}
            onChange={(e) => {
              setBookingSearch(e.target.value);
              setBookingId("");
              setDamageId("");
            }}
            placeholder="Booking ref, customer name..."
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Booking *</label>
          <select
            value={bookingId}
            onChange={(e) => {
              setBookingId(e.target.value);
              setDamageId("");
            }}
            disabled={loadingBookings}
            className={inputClass}
            required
          >
            <option value="">
              {loadingBookings ? "Loading bookings..." : "Select a booking"}
            </option>
            {bookingOptions.map((b) => (
              <option key={b.id} value={b.id}>
                {b.bookingRef} · {b.customerName} · {b.vehicleLabel} [{b.status}]
              </option>
            ))}
          </select>
        </div>

        {/* Damage select — only shown once booking is selected */}
        {bookingId && (
          <div>
            <label className={labelClass}>Damage Record *</label>
            <select
              value={damageId}
              onChange={(e) => setDamageId(e.target.value)}
              disabled={loadingDamages}
              className={inputClass}
              required
            >
              <option value="">
                {loadingDamages
                  ? "Loading damage records..."
                  : damageOptions.length === 0
                  ? "No damage records for this vehicle"
                  : "Select a damage record"}
              </option>
              {damageOptions.map((d) => (
                <option key={String(d.id)} value={String(d.id)}>
                  {d.description.substring(0, 60)}
                  {d.description.length > 60 ? "..." : ""} [{d.isFixed ? "Fixed" : "Open"} · {d.damageBy}]
                </option>
              ))}
            </select>
            {!loadingDamages && damageOptions.length === 0 && (
              <p className="mt-1 text-xs text-subtle">
                No open damage records for the selected booking&apos;s vehicle.{" "}
                <Link href="/damage/new" className="text-info hover:underline">
                  Report a new damage
                </Link>{" "}
                first.
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-danger/20 bg-danger-tint-6 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Link
            href="/damage-reports"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text hover:bg-body"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting || !bookingId || !damageId}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create Report"}
          </button>
        </div>
      </form>
    </div>
  );
}