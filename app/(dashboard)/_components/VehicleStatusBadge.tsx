// app/(dashboard)/_components/VehicleStatusBadge.tsx
// Small coloured pill for a vehicle's status. Colour mapping mirrors the
// design tokens declared in app/globals.css (@theme block).

import { VehicleStatus } from "@/service/vehicleService";

interface VehicleStatusBadgeProps {
  status: VehicleStatus | string;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  AVAILBLE: { bg: "bg-green-tint-10", text: "text-green", label: "Available" },
  RENTED: { bg: "bg-info-tint-12", text: "text-info", label: "Rented" },
  MAINTANANCE: { bg: "bg-warning/10", text: "text-warning", label: "Maintenance" },
  INACTIVE: { bg: "bg-danger-tint-6", text: "text-danger", label: "Inactive" },
};

export default function VehicleStatusBadge({ status }: VehicleStatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? {
    bg: "bg-border",
    text: "text-subtle",
    label: status,
  };

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold ${style.bg} ${style.text}`}
    >
      {style.label}
    </span>
  );
}
