// app/(dashboard)/overview/_components/VehicleStatusWidget.tsx
// Fleet status breakdown (counts by status) + list of vehicles currently
// out on rent, from GET /dashboard/overview.

import Link from "next/link";
import { VehicleStatus } from "@/service/dashboardService";

interface VehicleStatusWidgetProps {
  data: VehicleStatus | null;
  loading?: boolean;
}

const SEGMENTS: {
  key: keyof Pick<VehicleStatus, "available" | "rented" | "maintenance" | "inactive">;
  label: string;
  barClass: string;
  dotClass: string;
}[] = [
  { key: "available", label: "Available", barClass: "bg-green", dotClass: "bg-green" },
  { key: "rented", label: "Rented", barClass: "bg-info", dotClass: "bg-info" },
  { key: "maintenance", label: "Maintenance", barClass: "bg-warning", dotClass: "bg-warning" },
  { key: "inactive", label: "Inactive", barClass: "bg-danger", dotClass: "bg-danger" },
];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-LK", {
    day: "2-digit",
    month: "short",
  });
}

export default function VehicleStatusWidget({ data, loading = false }: VehicleStatusWidgetProps) {
  const total = data?.total ?? 0;

  return (
    <div className="rounded-xl border border-border bg-surface shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h3 className="text-sm font-semibold text-text">Vehicle Status</h3>
        <Link
          href="/vehicles"
          className="text-xs font-medium text-info hover:underline"
        >
          View fleet
        </Link>
      </div>

      <div className="px-5 py-4">
        {/* Breakdown bar */}
        {loading ? (
          <div className="h-2.5 w-full animate-pulse rounded-full bg-border" />
        ) : (
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-body">
            {SEGMENTS.map((seg) => {
              const count = data?.[seg.key] ?? 0;
              const pct = total > 0 ? (count / total) * 100 : 0;
              if (pct === 0) return null;
              return (
                <div
                  key={seg.key}
                  className={seg.barClass}
                  style={{ width: `${pct}%` }}
                  title={`${seg.label}: ${count}`}
                />
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {SEGMENTS.map((seg) => (
            <div key={seg.key} className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${seg.dotClass}`} />
              <span className="text-xs text-subtle">{seg.label}</span>
              <span className="ml-auto text-xs font-semibold text-text">
                {loading ? "-" : data?.[seg.key] ?? 0}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Currently rented list */}
      <div className="border-t border-border">
        <p className="px-5 pt-4 text-xs font-medium uppercase tracking-wide text-subtle">
          Currently Rented
        </p>

        <div className="divide-y divide-border">
          {loading &&
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="px-5 py-3">
                <div className="h-3.5 w-40 animate-pulse rounded bg-border" />
              </div>
            ))}

          {!loading && (data?.rentedVehicles.length ?? 0) === 0 && (
            <p className="px-5 py-6 text-center text-sm text-subtle">
              No vehicles out on rent right now.
            </p>
          )}

          {!loading &&
            data?.rentedVehicles.map((v) => (
              <div
                key={v.vehicleId}
                className="flex items-center justify-between gap-3 px-5 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text">
                    {v.vehicleName}{" "}
                    <span className="text-xs font-normal text-subtle">({v.regNo})</span>
                  </p>
                  <p className="truncate text-xs text-subtle">
                    {v.customerName} &middot; {v.bookingRef}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-medium text-info">
                  Due {formatDate(v.dropoffDate)}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
