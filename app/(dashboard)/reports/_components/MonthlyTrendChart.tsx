// app/(dashboard)/reports/_components/MonthlyTrendChart.tsx
// Dependency-free bar chart for month-by-month trends (revenue, bookings, damages).

import { MonthlyPoint } from "@/service/reportService";

interface MonthlyTrendChartProps {
  title: string;
  data: MonthlyPoint[];
  /** "amount" charts money values, "count" charts raw counts. */
  metric: "amount" | "count";
  formatValue?: (v: number) => string;
  loading?: boolean;
}

export default function MonthlyTrendChart({
  title,
  data,
  metric,
  formatValue = (v) => v.toLocaleString("en-LK"),
  loading = false,
}: MonthlyTrendChartProps) {
  const values = data.map((d) => (metric === "amount" ? d.amount : d.count));
  const max = Math.max(1, ...values);

  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-text">{title}</h3>

      {loading ? (
        <div className="mt-4 flex h-48 items-end gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex-1 animate-pulse rounded-t bg-border" style={{ height: `${30 + (i % 4) * 15}%` }} />
          ))}
        </div>
      ) : data.length === 0 ? (
        <p className="mt-6 text-center text-sm text-subtle">No data for this period.</p>
      ) : (
        <div className="mt-4">
          <div className="flex h-48 items-end gap-2">
            {data.map((point) => {
              const value = metric === "amount" ? point.amount : point.count;
              const heightPct = max === 0 ? 0 : Math.max(2, (value / max) * 100);
              return (
                <div key={point.month} className="group relative flex flex-1 flex-col items-center justify-end">
                  <div
                    className="w-full rounded-t bg-info transition-all group-hover:bg-info-hover"
                    style={{ height: `${heightPct}%` }}
                    title={`${point.month}: ${formatValue(value)}`}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex gap-2">
            {data.map((point) => (
              <div key={point.month} className="flex-1 truncate text-center text-[10px] text-subtle">
                {point.month.split(" ")[0]}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
