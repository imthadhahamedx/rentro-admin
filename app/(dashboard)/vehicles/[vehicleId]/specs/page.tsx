// app/(dashboard)/vehicles/[vehicleId]/specs/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { VehicleDetail, getVehicleById, getErrorMessage } from "@/service/vehicleService";

export default function VehicleSpecsPage() {
  const params = useParams<{ vehicleId: string }>();
  const vehicleId = params.vehicleId;

  const [vehicle, setVehicle] = useState<VehicleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="h-6 w-48 animate-pulse rounded bg-border" />
        <div className="h-40 w-full animate-pulse rounded-xl bg-border" />
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Link href="/vehicles" className="text-xs font-medium text-info hover:underline">
          ← Back to vehicles
        </Link>
        <div className="rounded-lg border border-danger/20 bg-danger-tint-6 px-4 py-3 text-sm text-danger">
          {error ?? "Vehicle not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href={`/vehicles/${vehicleId}`} className="text-xs font-medium text-info hover:underline">
          ← Back to vehicle
        </Link>
        <h1 className="mt-2 text-xl font-bold text-text">Specifications</h1>
        <p className="mt-1 text-sm text-subtle">
          {vehicle.make} {vehicle.model} · {vehicle.regNo}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-text">Attached Specifications</h3>

        {vehicle.specifications.length === 0 ? (
          <p className="text-sm text-subtle">No specifications have been attached to this vehicle yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {vehicle.specifications.map((spec, i) => (
              <span key={i} className="rounded-full border border-border bg-body/50 px-3 py-1.5 text-sm text-text">
                {spec}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-info/20 bg-info-tint-12 px-4 py-3 text-sm text-info">
        Specification tags are attached by ID when a vehicle is created or updated (via the "specIds" field
        used with the Vehicle create/update API). There is currently no API endpoint for browsing, creating,
        or renaming individual specification records, so this page shows a read-only view of what's already
        attached. To change which specifications this vehicle has, use{" "}
        <Link href={`/vehicles/${vehicleId}/edit`} className="font-medium underline">
          Edit Vehicle
        </Link>{" "}
        once specification IDs are available.
      </div>
    </div>
  );
}
