// app/(dashboard)/reports/_components/ReportStatCard.tsx
// Lightweight summary tile used across all report pages.

import { ReactNode } from "react";

interface ReportStatCardProps {
  label: string;
  value: string;
  subtitle?: string;
  icon?: ReactNode;
  loading?: boolean;
}

export default function ReportStatCard({ label, value, subtitle, icon, loading = false }: ReportStatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-subtle">{label}</p>
          {loading ? (
            <div className="mt-2 h-7 w-24 animate-pulse rounded bg-border" />
          ) : (
            <p className="mt-1 truncate text-2xl font-bold text-text">{value}</p>
          )}
          {subtitle && !loading && <p className="mt-1 truncate text-xs text-subtle">{subtitle}</p>}
        </div>
        {icon && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-info-tint-12 text-info">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
