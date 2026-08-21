// app/(dashboard)/locations/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createLocation, getErrorMessage } from "@/service/locationService";

export default function NewLocationPage() {
  const router = useRouter();

  const [locationName, setLocationName] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!locationName.trim() || !city.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    if (latitude && (Number.isNaN(Number(latitude)) || Math.abs(Number(latitude)) > 90)) {
      setError("Latitude must be a number between -90 and 90.");
      return;
    }
    if (longitude && (Number.isNaN(Number(longitude)) || Math.abs(Number(longitude)) > 180)) {
      setError("Longitude must be a number between -180 and 180.");
      return;
    }

    try {
      setSubmitting(true);
      const location = await createLocation({
        locationName: locationName.trim(),
        city: city.trim(),
        address: address.trim() || undefined,
        latitude: latitude ? Number(latitude) : undefined,
        longitude: longitude ? Number(longitude) : undefined,
        isActive,
      });
      router.push(`/locations/${location.id}`);
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't create the location. Please try again."));
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
        <Link href="/locations" className="text-xs font-medium text-info hover:underline">
          ← Back to locations
        </Link>
        <h1 className="mt-2 text-xl font-bold text-text">New Location</h1>
        <p className="mt-1 text-sm text-subtle">Add a new pickup / drop-off branch.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-danger/20 bg-danger-tint-6 px-4 py-3 text-sm text-danger">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-text">Location Details</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass}>Location Name *</label>
              <input
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className={inputClass}
                placeholder="e.g. Colombo Fort Branch"
                required
              />
            </div>
            <div>
              <label className={labelClass}>City *</label>
              <input value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} placeholder="e.g. Colombo" required />
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select
                value={isActive ? "true" : "false"}
                onChange={(e) => setIsActive(e.target.value === "true")}
                className={inputClass}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Address</label>
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} rows={2} placeholder="Street, building, landmarks..." />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-text">Map Coordinates</h3>
          <p className="mb-4 text-xs text-subtle">
            Optional. Used to plot this location on the map for customers and staff.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Latitude</label>
              <input
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className={inputClass}
                placeholder="e.g. 6.9271"
              />
            </div>
            <div>
              <label className={labelClass}>Longitude</label>
              <input
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className={inputClass}
                placeholder="e.g. 79.8612"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link href="/locations" className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text hover:bg-body">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create Location"}
          </button>
        </div>
      </form>
    </div>
  );
}
