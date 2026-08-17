// app/(dashboard)/vehicles/[vehicleId]/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  VehicleDetail,
  VehicleStatus,
  getVehicleById,
  updateVehicleStatus,
  deleteVehicle,
  getErrorMessage,
} from "@/service/vehicleService";
import VehicleStatusBadge from "../../_components/VehicleStatusBadge";
import RoleGate from "../../_components/RoleGate";

const STATUS_OPTIONS: VehicleStatus[] = ["AVAILABLE", "RENTED", "MAINTENANCE", "INACTIVE"];

function formatCurrency(amount: number | null | undefined): string {
  return `Rs. ${(amount ?? 0).toLocaleString("en-LK", { maximumFractionDigits: 0 })}`;
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

function CarPlaceholderIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-10 w-10 text-subtle">
      <path d="M3 13l1.5-4.5A2 2 0 0 1 6.4 7h11.2a2 2 0 0 1 1.9 1.5L21 13" />
      <path d="M3 13h18v4a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H6v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4Z" />
      <circle cx="7.5" cy="17.5" r="1.5" />
      <circle cx="16.5" cy="17.5" r="1.5" />
    </svg>
  );
}

export default function VehicleDetailPage() {
  const params = useParams<{ vehicleId: string }>();
  const router = useRouter();
  const vehicleId = params.vehicleId;

  const [vehicle, setVehicle] = useState<VehicleDetail | null>(null);
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
      const data = await getVehicleById(vehicleId);
      setVehicle(data);
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't load this vehicle."));
    } finally {
      setLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleStatusChange(newStatus: VehicleStatus) {
    if (!vehicle || newStatus === vehicle.status) return;
    try {
      setStatusSaving(true);
      setStatusError(null);
      await updateVehicleStatus(vehicleId, newStatus);
      setVehicle((prev) => (prev ? { ...prev, status: newStatus } : prev));
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
      await deleteVehicle(vehicleId);
      router.push("/vehicles");
    } catch (err) {
      setDeleteError(getErrorMessage(err, "Couldn't delete this vehicle."));
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

  if (error || !vehicle) {
    return (
      <div className="space-y-4">
        <Link href="/vehicles" className="text-xs font-medium text-info hover:underline">
          ← Back to vehicles
        </Link>
        <div className="rounded-lg border border-danger/20 bg-danger-tint-6 px-4 py-3 text-sm text-danger">
          {error ?? "Vehicle not found."}
        </div>
      </div>
    );
  }

  const primaryImage = vehicle.images.find((i) => i.isPrimary) ?? vehicle.images[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/vehicles" className="text-xs font-medium text-info hover:underline">
          ← Back to vehicles
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-text">
              {vehicle.make} {vehicle.model} <span className="text-subtle">({vehicle.modelYear})</span>
            </h1>
            <VehicleStatusBadge status={vehicle.status} />
          </div>

          <RoleGate allow={["STAFF", "ADMIN", "SUPER_ADMIN"]}>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/vehicles/${vehicle.id}/images`}
                className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-text hover:bg-body"
              >
                Manage Images
              </Link>
              <Link
                href={`/vehicles/${vehicle.id}/specs`}
                className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-text hover:bg-body"
              >
                Specifications
              </Link>
              <Link
                href={`/vehicles/${vehicle.id}/edit`}
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
            Delete {vehicle.make} {vehicle.model} ({vehicle.regNo})? This removes the vehicle, its images, and specification links. This
            cannot be undone.
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
          {/* Hero image */}
          <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
            <div className="flex h-56 w-full items-center justify-center bg-body/50">
              {primaryImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={primaryImage.url} alt={`${vehicle.make} ${vehicle.model}`} className="h-full w-full object-cover" />
              ) : (
                <CarPlaceholderIcon />
              )}
            </div>
            {vehicle.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto p-3">
                {vehicle.images.map((img) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={img.id}
                    src={img.url}
                    alt={img.fileName}
                    className={`h-14 w-20 shrink-0 rounded-lg border object-cover ${img.isPrimary ? "border-primary" : "border-border"}`}
                  />
                ))}
              </div>
            )}
          </div>

          <SectionCard title="Vehicle Details">
            <Row label="Registration No" value={vehicle.regNo} />
            <Row label="Category" value={vehicle.categoryName} />
            <Row label="Colour" value={vehicle.colour || "—"} />
            <Row label="Transmission" value={vehicle.transmission} />
            <Row label="Fuel Type" value={vehicle.fuelType} />
            <Row label="Seats" value={vehicle.seatCount} />
            <Row label="Doors" value={vehicle.doorCount} />
            <Row label="Current Mileage" value={vehicle.currentMilageKm != null ? `${vehicle.currentMilageKm.toLocaleString()} km` : "—"} />
          </SectionCard>

          <SectionCard title="Specifications">
            {vehicle.specifications.length === 0 ? (
              <p className="text-sm text-subtle">No specifications recorded for this vehicle.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {vehicle.specifications.map((spec, i) => (
                  <span key={i} className="rounded-full border border-border bg-body/50 px-3 py-1 text-xs text-text">
                    {spec}
                  </span>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <SectionCard title="Status">
            <div className="space-y-3">
              <select
                value={vehicle.status}
                onChange={(e) => handleStatusChange(e.target.value as VehicleStatus)}
                disabled={statusSaving}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-info focus:outline-none disabled:opacity-60"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {statusSaving && <p className="text-xs text-subtle">Saving...</p>}
              {statusError && <p className="text-xs text-danger">{statusError}</p>}
            </div>
          </SectionCard>

          <SectionCard title="Pricing">
            <Row label="Daily Rate" value={formatCurrency(vehicle.dailyRate)} />
          </SectionCard>

          <SectionCard title="Record">
            <Row label="Created" value={formatDateTime(vehicle.createdAt)} />
            <Row label="Last Updated" value={formatDateTime(vehicle.updatedAt)} />
            <Row label="Images" value={vehicle.images.length} />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
