// app/(dashboard)/locations/[locationId]/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LocationItem,
  getLocationById,
  updateLocationStatus,
  deleteLocation,
  getErrorMessage,
} from "@/service/locationService";
import LocationStatusBadge from "../../_components/LocationStatusBadge";
import RoleGate from "../../_components/RoleGate";

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

function SectionCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text">{title}</h3>
        {action}
      </div>
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

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-7 w-7">
      <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.3" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
      <PinIcon />
    </div>
  );
}

export default function LocationDetailPage() {
  const params = useParams<{ locationId: string }>();
  const router = useRouter();
  const locationId = params.locationId;

  const [location, setLocation] = useState<LocationItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusSaving, setStatusSaving] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getLocationById(locationId);
      setLocation(data);
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't load this location."));
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleToggleStatus() {
    if (!location) return;
    try {
      setStatusSaving(true);
      setStatusError(null);
      const nextActive = !location.isActive;
      await updateLocationStatus(locationId, nextActive);
      setLocation((prev) => (prev ? { ...prev, isActive: nextActive } : prev));
    } catch (err) {
      setStatusError(getErrorMessage(err, "Couldn't update status."));
    } finally {
      setStatusSaving(false);
    }
  }

  async function handleDelete() {
    try {
      setDeleting(true);
      setDeleteError(null);
      await deleteLocation(locationId);
      router.push("/locations");
    } catch (err) {
      setDeleteError(getErrorMessage(err, "Couldn't delete this location."));
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-48 animate-pulse rounded bg-border" />
        <div className="h-40 w-full animate-pulse rounded-xl bg-border" />
        <div className="h-40 w-full animate-pulse rounded-xl bg-border" />
      </div>
    );
  }

  if (error || !location) {
    return (
      <div className="space-y-4">
        <Link href="/locations" className="text-xs font-medium text-info hover:underline">
          ← Back to locations
        </Link>
        <div className="rounded-lg border border-danger/20 bg-danger-tint-6 px-4 py-3 text-sm text-danger">
          {error ?? "Location not found."}
        </div>
      </div>
    );
  }

  const hasCoordinates = location.latitude != null && location.longitude != null;
  const mapsUrl = hasCoordinates
    ? `https://www.google.com/maps?q=${location.latitude},${location.longitude}`
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/locations" className="text-xs font-medium text-info hover:underline">
          ← Back to locations
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <LocationIcon />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-text">{location.locationName}</h1>
                <LocationStatusBadge isActive={location.isActive} />
              </div>
              <p className="text-xs text-subtle">{location.city} · Added {formatDateTime(location.createdAt)}</p>
            </div>
          </div>

          <RoleGate allow={["STAFF", "ADMIN", "SUPER_ADMIN"]}>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/locations/${location.id}/edit`}
                className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white hover:opacity-90"
              >
                Edit
              </Link>
              <RoleGate allow={["SUPER_ADMIN"]}>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="rounded-lg border border-danger/30 px-3 py-2 text-xs font-medium text-danger hover:bg-danger-tint-6"
                >
                  Delete
                </button>
              </RoleGate>
            </div>
          </RoleGate>
        </div>
      </div>

      {deleteError && (
        <div className="rounded-lg border border-danger/20 bg-danger-tint-6 px-4 py-3 text-sm text-danger">{deleteError}</div>
      )}

      {showDeleteConfirm && (
        <div className="rounded-xl border border-danger/30 bg-danger-tint-6 p-5">
          <p className="text-sm font-medium text-text">
            Delete {location.locationName}? This is only possible when the location has no bookings on
            record. This cannot be undone.
          </p>
          <div className="mt-3 flex gap-3">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Yes, delete"}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deleting}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text hover:bg-body"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          <SectionCard title="Location Details">
            <Row label="Location Name" value={location.locationName} />
            <Row label="City" value={location.city} />
          </SectionCard>

          <SectionCard title="Address">
            {location.address ? (
              <p className="whitespace-pre-wrap text-sm text-text">{location.address}</p>
            ) : (
              <p className="text-sm text-subtle">No address on file.</p>
            )}
          </SectionCard>

          <SectionCard
            title="Map Coordinates"
            action={
              mapsUrl && (
                <a href={mapsUrl} target="_blank" rel="noreferrer" className="text-xs font-medium text-info hover:underline">
                  Open in Google Maps
                </a>
              )
            }
          >
            {hasCoordinates ? (
              <>
                <Row label="Latitude" value={location.latitude} />
                <Row label="Longitude" value={location.longitude} />
              </>
            ) : (
              <p className="text-sm text-subtle">No coordinates recorded for this location.</p>
            )}
          </SectionCard>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <SectionCard title="Branch Status">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text">
                  {location.isActive ? "Active — available for bookings" : "Inactive — hidden from bookings"}
                </span>
                <LocationStatusBadge isActive={location.isActive} />
              </div>
              <RoleGate allow={["STAFF", "ADMIN", "SUPER_ADMIN"]}>
                <button
                  onClick={handleToggleStatus}
                  disabled={statusSaving}
                  className={`w-full rounded-lg border px-3 py-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-60 ${
                    location.isActive
                      ? "border-danger/30 text-danger hover:bg-danger-tint-6"
                      : "border-green-tint-10 text-green hover:bg-green-tint-10"
                  }`}
                >
                  {statusSaving ? "Saving..." : location.isActive ? "Deactivate Location" : "Activate Location"}
                </button>
              </RoleGate>
              {statusError && <p className="text-xs text-danger">{statusError}</p>}
            </div>
          </SectionCard>

          <SectionCard title="Bookings">
            <Row label="Pickup Bookings" value={location.pickupBookingCount} />
            <Row label="Drop-off Bookings" value={location.dropoffBookingCount} />
            <Row label="Total Bookings" value={location.totalBookingCount} />
          </SectionCard>

          <SectionCard title="Record">
            <Row label="Created" value={formatDateTime(location.createdAt)} />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
