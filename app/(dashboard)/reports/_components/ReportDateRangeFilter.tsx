// app/(dashboard)/reports/_components/ReportDateRangeFilter.tsx
// Shared date-range control + quick presets used by every report page.

"use client";

interface ReportDateRangeFilterProps {
  startDate: string;
  endDate: string;
  onChange: (next: { startDate: string; endDate: string }) => void;
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function monthsAgoStart(months: number): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - (months - 1));
  return toIsoDate(d);
}

const PRESETS: { label: string; getRange: () => { startDate: string; endDate: string } }[] = [
  {
    label: "Last 3 months",
    getRange: () => ({ startDate: monthsAgoStart(3), endDate: toIsoDate(new Date()) }),
  },
  {
    label: "Last 6 months",
    getRange: () => ({ startDate: monthsAgoStart(6), endDate: toIsoDate(new Date()) }),
  },
  {
    label: "Last 12 months",
    getRange: () => ({ startDate: monthsAgoStart(12), endDate: toIsoDate(new Date()) }),
  },
  {
    label: "This year",
    getRange: () => {
      const now = new Date();
      return { startDate: `${now.getFullYear()}-01-01`, endDate: toIsoDate(now) };
    },
  },
];

export default function ReportDateRangeFilter({ startDate, endDate, onChange }: ReportDateRangeFilterProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            onClick={() => onChange(preset.getRange())}
            className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-subtle transition-colors hover:bg-body hover:text-text"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-xs text-subtle">
          From
          <input
            type="date"
            value={startDate}
            max={endDate}
            onChange={(e) => onChange({ startDate: e.target.value, endDate })}
            className="rounded-lg border border-border bg-body px-2 py-1.5 text-sm text-text focus:border-info focus:outline-none"
          />
        </label>
        <label className="flex items-center gap-2 text-xs text-subtle">
          To
          <input
            type="date"
            value={endDate}
            min={startDate}
            max={toIsoDate(new Date())}
            onChange={(e) => onChange({ startDate, endDate: e.target.value })}
            className="rounded-lg border border-border bg-body px-2 py-1.5 text-sm text-text focus:border-info focus:outline-none"
          />
        </label>
      </div>
    </div>
  );
}

export { toIsoDate, monthsAgoStart };
