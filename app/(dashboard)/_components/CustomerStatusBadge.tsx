// app/(dashboard)/_components/CustomerStatusBadge.tsx
// Small coloured pill for a customer's active/inactive state. Colour mapping
// mirrors the design tokens declared in app/globals.css (@theme block).

interface CustomerStatusBadgeProps {
  isActive: boolean;
}

export default function CustomerStatusBadge({ isActive }: CustomerStatusBadgeProps) {
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
