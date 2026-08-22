// app/(dashboard)/reports/page.tsx
"use client";

import Link from "next/link";
import { ReactNode } from "react";

function RevenueIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M9 9.5c0-1.4 1.3-2.5 3-2.5s3 .9 3 2c0 3-6 1.5-6 4.5 0 1.1 1.3 2 3 2s3-1.1 3-2.5" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function CarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M3 13l1.5-4.5A2 2 0 0 1 6.4 7h11.2a2 2 0 0 1 1.9 1.5L21 13" />
      <path d="M3 13h18v4a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H6v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4Z" />
      <circle cx="7.5" cy="17.5" r="1.5" />
      <circle cx="16.5" cy="17.5" r="1.5" />
    </svg>
  );
}

function DamageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M12 3 2 20h20L12 3Z" />
      <path d="M12 10v4M12 17h.01" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

interface ReportCard {
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
  iconBg: string;
  iconText: string;
}

const REPORT_CARDS: ReportCard[] = [
  {
    title: "Revenue Report",
    description: "Track completed payments, breakdowns by method and type, and top-earning vehicles.",
    href: "/reports/revenue",
    icon: <RevenueIcon />,
    iconBg: "bg-green-tint-10",
    iconText: "text-green",
  },
  {
    title: "Bookings Report",
    description: "Booking volume over time, status mix, popular pickup locations, and top customers.",
    href: "/reports/bookings",
    icon: <CalendarIcon />,
    iconBg: "bg-info-tint-12",
    iconText: "text-info",
  },
  {
    title: "Vehicle Utilization",
    description: "Fleet status and category mix, plus per-vehicle bookings, revenue, and utilization rate.",
    href: "/reports/vehicles",
    icon: <CarIcon />,
    iconBg: "bg-primary/10",
    iconText: "text-primary",
  },
  {
    title: "Damage Report",
    description: "Damage volume over time, who caused it, fixed vs. outstanding, and the most-damaged vehicles.",
    href: "/reports/damage",
    icon: <DamageIcon />,
    iconBg: "bg-danger-tint-6",
    iconText: "text-danger",
  },
];

export default function ReportsHubPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text">Reports</h1>
        <p className="mt-1 text-sm text-subtle">
          Pick a report below to dig into revenue, bookings, fleet utilization, or damage trends.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {REPORT_CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group flex items-start gap-4 rounded-xl border border-border bg-surface p-5 shadow-sm transition-colors hover:bg-body"
          >
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${card.iconBg} ${card.iconText}`}>
              {card.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-text">{card.title}</h3>
                <ArrowIcon />
              </div>
              <p className="mt-1 text-xs leading-relaxed text-subtle">{card.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
