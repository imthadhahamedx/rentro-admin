// app/(dashboard)/reports/_components/BreakdownBarList.tsx
// Renders a labeled list ("by status", "by payment method", etc.) with a
// proportional bar next to each row, sorted by whatever order the API gave us.

interface BreakdownRow {
  label: string;
  value: number;
  secondary?: string;
}

interface BreakdownBarListProps {
  title: string;
  rows: BreakdownRow[];
  formatValue?: (v: number) => string;
  loading?: boolean;
  emptyText?: string;
}

const BAR_COLORS = ["bg-info", "bg-green", "bg-primary", "bg-warning", "bg-danger", "bg-accent"];

export default function BreakdownBarList({
  title,
  rows,
  formatValue = (v) => v.toLocaleString("en-LK"),
  loading = false,
  emptyText = "No data for this period.",
}: BreakdownBarListProps) {
  const max = Math.max(1, ...rows.map((r) => r.value));

  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-text">{title}</h3>

      <div className="mt-4 space-y-3">
        {loading &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-6 animate-pulse rounded bg-border" />
          ))}

        {!loading && rows.length === 0 && <p className="text-sm text-subtle">{emptyText}</p>}

        {!loading &&
          rows.map((row, i) => (
            <div key={row.label}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium capitalize text-text">{row.label.toLowerCase().replace(/_/g, " ")}</span>
                <span className="text-subtle">
                  {formatValue(row.value)}
                  {row.secondary ? ` · ${row.secondary}` : ""}
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-body">
                <div
                  className={`h-full rounded-full ${BAR_COLORS[i % BAR_COLORS.length]}`}
                  style={{ width: `${Math.max(2, (row.value / max) * 100)}%` }}
                />
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
