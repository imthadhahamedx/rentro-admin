// app/(dashboard)/_components/LocationStatusBadge.tsx
// Small coloured pill for a location's active/inactive state. Colour mapping
// mirrors the design tokens declared in app/globals.css (@theme block).

interface LocationStatusBadgeProps {
  isActive: boolean;
}

export default function LocationStatusBadge({ isActive }: LocationStatusBadgeProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        isActive ? "bg-green-tint-10 text-green" : "bg-danger-tint-6 text-danger"
      }`}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}
