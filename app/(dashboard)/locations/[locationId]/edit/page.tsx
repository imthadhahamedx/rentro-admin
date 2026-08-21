// app/(dashboard)/locations/[locationId]/edit/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getLocationById, updateLocation, getErrorMessage } from "@/service/locationService";

export default function EditLocationPage() {
  const params = useParams<{ locationId: string }>();
  const router = useRouter();
  const locationId = params.locationId;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [locationName, setLocationName] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const l = await getLocationById(locationId);
      setLocationName(l.locationName);
      setCity(l.city);
      setAddress(l.address ?? "");
      setLatitude(l.latitude != null ? String(l.latitude) : "");
      setLongitude(l.longitude != null ? String(l.longitude) : "");
      setIsActive(l.isActive);
    } catch (err) {
      setLoadError(getErrorMessage(err, "Couldn't load this location."));
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  useEffect(() => {
    load();
  }, [load]);

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
      await updateLocation(locationId, {
        locationName: locationName.trim(),
        city: city.trim(),
        address: address.trim() || undefined,
        latitude: latitude ? Number(latitude) : undefined,
        longitude: longitude ? Number(longitude) : undefined,
        isActive,
      });
      router.push(`/locations/${locationId}`);
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't update the location. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-info focus:outline-none disabled:opacity-60";
  const labelClass = "mb-1.5 block text-xs font-medium text-subtle";

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="h-6 w-48 animate-pulse rounded bg-border" />
        <div className="h-64 w-full animate-pulse rounded-xl bg-border" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Link href={`/locations/${locationId}`} className="text-xs font-medium text-info hover:underline">
          ← Back to location
        </Link>
        <div className="rounded-lg border border-danger/20 bg-danger-tint-6 px-4 py-3 text-sm text-danger">{loadError}</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href={`/locations/${locationId}`} className="text-xs font-medium text-info hover:underline">
          ← Back to location
        </Link>
        <h1 className="mt-2 text-xl font-bold text-text">Edit Location</h1>
        <p className="mt-1 text-sm text-subtle">Update {locationName}&apos;s details.</p>
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
              <input value={locationName} onChange={(e) => setLocationName(e.target.value)} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>City *</label>
              <input value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} required />
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
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} rows={2} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-text">Map Coordinates</h3>
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
          <Link href={`/locations/${locationId}`} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text hover:bg-body">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
