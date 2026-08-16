// app/(dashboard)/bookings/new/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CustomerOption,
  VehicleOption,
  LocationOption,
  getCustomerOptions,
  getAvailableVehicleOptions,
  getLocationOptions,
  createBooking,
  getErrorMessage,
} from "@/service/bookingService";

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function daysBetween(a: string, b: string): number {
  if (!a || !b) return 0;
  const d1 = new Date(a);
  const d2 = new Date(b);
  const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

function formatCurrency(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-LK", { maximumFractionDigits: 0 })}`;
}

export default function NewBookingPage() {
  const router = useRouter();

  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  const [customerId, setCustomerId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [pickupLocationId, setPickupLocationId] = useState("");
  const [dropoffLocationId, setDropoffLocationId] = useState("");
  const [pickupDate, setPickupDate] = useState(todayISO());
  const [dropoffDate, setDropoffDate] = useState("");
  const [discountAmount, setDiscountAmount] = useState("0");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoadingOptions(true);
        setOptionsError(null);
        const [c, v, l] = await Promise.all([
          getCustomerOptions(),
          getAvailableVehicleOptions(),
          getLocationOptions(),
        ]);
        if (cancelled) return;
        setCustomers(c);
        setVehicles(v);
        setLocations(l);
      } catch (err) {
        if (!cancelled) {
          setOptionsError(getErrorMessage(err, "Couldn't load form data. Please refresh."));
        }
      } finally {
        if (!cancelled) setLoadingOptions(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.id === vehicleId) ?? null,
    [vehicles, vehicleId]
  );

  const totalDays = useMemo(
    () => Math.max(1, daysBetween(pickupDate, dropoffDate)),
    [pickupDate, dropoffDate]
  );

  const totalAmount = useMemo(
    () => (selectedVehicle ? selectedVehicle.dailyRate * totalDays : 0),
    [selectedVehicle, totalDays]
  );

  const discount = Number(discountAmount) || 0;
  const finalAmount = Math.max(0, totalAmount - discount);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!customerId || !vehicleId || !pickupLocationId || !dropoffLocationId || !dropoffDate) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!(dropoffDate > pickupDate)) {
      setError("Dropoff date must be after the pickup date.");
      return;
    }

    try {
      setSubmitting(true);
      const id = await createBooking({
        customerId,
        vehicleId,
        pickupLocationId,
        dropoffLocationId,
        pickupDate,
        dropoffDate,
        discountAmount: discount,
        notes: notes.trim() || undefined,
      });
      router.push(`/booking/${id}`);
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't create the booking. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-info focus:outline-none disabled:opacity-60";
  const labelClass = "mb-1.5 block text-xs font-medium text-subtle";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/booking" className="text-xs font-medium text-info hover:underline">
          ← Back to booking
        </Link>
        <h1 className="mt-2 text-xl font-bold text-text">New Booking</h1>
        <p className="mt-1 text-sm text-subtle">Create a reservation for a customer.</p>
      </div>

      {optionsError && (
        <div className="rounded-lg border border-danger/20 bg-danger-tint-6 px-4 py-3 text-sm text-danger">
          {optionsError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-border bg-surface p-6 shadow-sm">
        {/* Customer & vehicle */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Customer *</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              disabled={loadingOptions}
              className={inputClass}
              required
            >
              <option value="">Select customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} — {c.phone}
                </option>
              ))}
            </select>
            {!loadingOptions && customers.length === 0 && (
              <p className="mt-1 text-xs text-subtle">No customers found.</p>
            )}
          </div>

          <div>
            <label className={labelClass}>Vehicle *</label>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              disabled={loadingOptions}
              className={inputClass}
              required
            >
              <option value="">Select available vehicle</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.make} {v.model} · {v.regNo} — {formatCurrency(v.dailyRate)}/day
                </option>
              ))}
            </select>
            {!loadingOptions && vehicles.length === 0 && (
              <p className="mt-1 text-xs text-subtle">No available vehicles right now.</p>
            )}
          </div>
        </div>

        {/* Locations */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Pickup Location *</label>
            <select
              value={pickupLocationId}
              onChange={(e) => setPickupLocationId(e.target.value)}
              disabled={loadingOptions}
              className={inputClass}
              required
            >
              <option value="">Select location</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.locationName} — {l.city}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Dropoff Location *</label>
            <select
              value={dropoffLocationId}
              onChange={(e) => setDropoffLocationId(e.target.value)}
              disabled={loadingOptions}
              className={inputClass}
              required
            >
              <option value="">Select location</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.locationName} — {l.city}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Pickup Date *</label>
            <input
              type="date"
              value={pickupDate}
              min={todayISO()}
              onChange={(e) => setPickupDate(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Dropoff Date *</label>
            <input
              type="date"
              value={dropoffDate}
              min={pickupDate}
              onChange={(e) => setDropoffDate(e.target.value)}
              className={inputClass}
              required
            />
          </div>
        </div>

        {/* Discount & notes */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Discount Amount</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className={inputClass}
            placeholder="Any special instructions for this booking..."
          />
        </div>

        {/* Price summary */}
        {selectedVehicle && dropoffDate && (
          <div className="rounded-lg border border-border bg-body/50 p-4 text-sm">
            <div className="flex justify-between text-subtle">
              <span>{totalDays} day(s) × {formatCurrency(selectedVehicle.dailyRate)}</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
            {discount > 0 && (
              <div className="mt-1 flex justify-between text-subtle">
                <span>Discount</span>
                <span>- {formatCurrency(discount)}</span>
              </div>
            )}
            <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-semibold text-text">
              <span>Total</span>
              <span>{formatCurrency(finalAmount)}</span>
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
            href="/booking"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text hover:bg-body"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting || loadingOptions}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create Booking"}
          </button>
        </div>
      </form>
    </div>
  );
}
