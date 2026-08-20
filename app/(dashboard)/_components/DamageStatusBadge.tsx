// app/(dashboard)/_components/DamageStatusBadge.tsx
// Small coloured pill for a damage record's fixed/open state. Colour mapping
// mirrors the design tokens declared in app/globals.css (@theme block).

interface DamageStatusBadgeProps {
  isFixed: boolean;
}

export default function DamageStatusBadge({ isFixed }: DamageStatusBadgeProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        isFixed ? "bg-green-tint-10 text-green" : "bg-warning/10 text-warning"
      }`}
    >
      {isFixed ? "Fixed" : "Open"}
    </span>
  );
}
