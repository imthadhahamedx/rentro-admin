// app/(dashboard)/_components/BookingStatusBadge.tsx
// Small coloured pill for a booking's status. Colour mapping mirrors the
// design tokens declared in app/globals.css (@theme block).

import { BookingStatus } from "@/service/dashboardService";

interface BookingStatusBadgeProps {
  status: BookingStatus | string;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  PENDING: { bg: "bg-warning/10", text: "text-warning", label: "Pending" },
  CONFIRMED: { bg: "bg-info-tint-12", text: "text-info", label: "Confirmed" },
  ACTIVE: { bg: "bg-green-tint-10", text: "text-green", label: "Active" },
  COMPLETED: { bg: "bg-primary/10", text: "text-primary", label: "Completed" },
  CANCELLED: { bg: "bg-danger-tint-6", text: "text-danger", label: "Cancelled" },
  NO_SHOW: { bg: "bg-danger-tint-6", text: "text-danger", label: "No Show" },
};

export default function BookingStatusBadge({ status }: BookingStatusBadgeProps) {
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
