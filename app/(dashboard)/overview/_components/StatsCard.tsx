// app/(dashboard)/overview/_components/StatsCard.tsx
// Single reusable stat card. Colour is driven by `variant`, which maps to the
// design tokens declared in app/globals.css (@theme block).

import { ReactNode } from "react";

export type StatsCardVariant = "info" | "green" | "warning" | "danger" | "primary";

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: ReactNode;
  variant?: StatsCardVariant;
  loading?: boolean;
}

const VARIANT_STYLES: Record<StatsCardVariant, { iconBg: string; iconText: string }> = {
  info: { iconBg: "bg-info-tint-12", iconText: "text-info" },
  green: { iconBg: "bg-green-tint-10", iconText: "text-green" },
  warning: { iconBg: "bg-warning/10", iconText: "text-warning" },
  danger: { iconBg: "bg-danger-tint-6", iconText: "text-danger" },
  primary: { iconBg: "bg-primary/10", iconText: "text-primary" },
};

export default function StatsCard({
  title,
  value,
  subtitle,
  icon,
  variant = "primary",
  loading = false,
}: StatsCardProps) {
  const styles = VARIANT_STYLES[variant];

  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-subtle">
            {title}
          </p>

          {loading ? (
            <div className="mt-2 h-7 w-20 animate-pulse rounded bg-border" />
          ) : (
            <p className="mt-1 truncate text-2xl font-bold text-text">{value}</p>
          )}

          {subtitle && !loading && (
            <p className="mt-1 truncate text-xs text-subtle">{subtitle}</p>
          )}
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${styles.iconBg} ${styles.iconText}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
