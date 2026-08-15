// app/(dashboard)/overview/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import {
  DashboardOverview,
  getDashboardOverview,
} from "@/service/dashboardService";
import StatsCard, { StatsCardVariant } from "./_components/StatsCard";
import RecentBookings from "./_components/RecentBookings";
import VehicleStatusWidget from "./_components/VehicleStatusWidget";

// ─── Icons (inline, no external icon package required) ──────────────────────

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function RevenueIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M9 9.5c0-1.4 1.3-2.5 3-2.5s3 .9 3 2c0 3-6 1.5-6 4.5 0 1.1 1.3 2 3 2s3-1.1 3-2.5" />
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

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3 2.7-5 6-5s6 2 6 5" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M15.5 15.2c2.6.4 4.5 2.1 4.5 4.8" />
    </svg>
  );
}

function ClockPaymentIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
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

// ─── Formatting helpers ───────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `Rs. ${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `Rs. ${(amount / 1_000).toFixed(1)}K`;
  return `Rs. ${amount.toLocaleString("en-LK", { maximumFractionDigits: 0 })}`;
}

function formatNumber(n: number): string {
  return n.toLocaleString("en-LK");
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function OverviewPage() {
  const { user } = useAuth();

  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await getDashboardOverview();
        if (!cancelled) setOverview(data);
      } catch (err) {
        if (!cancelled) {
          setError("Couldn't load dashboard data. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = overview?.stats ?? null;

  const cards: {
    title: string;
    value: string;
    subtitle: string;
    icon: React.ReactNode;
    variant: StatsCardVariant;
  }[] = [
    {
      title: "Bookings This Month",
      value: formatNumber(stats?.bookingsThisMonth ?? 0),
      subtitle: `${formatNumber(stats?.activeBookings ?? 0)} currently active`,
      icon: <CalendarIcon />,
      variant: "info",
    },
    {
      title: "Revenue This Month",
      value: formatCurrency(stats?.revenueThisMonth ?? 0),
      subtitle: `${formatCurrency(stats?.totalRevenue ?? 0)} all-time`,
      icon: <RevenueIcon />,
      variant: "green",
    },
    {
      title: "Fleet",
      value: formatNumber(stats?.totalVehicles ?? 0),
      subtitle: `${formatNumber(stats?.availableVehicles ?? 0)} available now`,
      icon: <CarIcon />,
      variant: "primary",
    },
    {
      title: "Customers",
      value: formatNumber(stats?.totalCustomers ?? 0),
      subtitle: `+${formatNumber(stats?.newCustomersThisMonth ?? 0)} this month`,
      icon: <UsersIcon />,
      variant: "info",
    },
    {
      title: "Pending Payments",
      value: formatNumber(stats?.pendingPaymentsCount ?? 0),
      subtitle: `${formatCurrency(stats?.pendingPaymentsAmount ?? 0)} outstanding`,
      icon: <ClockPaymentIcon />,
      variant: "warning",
    },
    {
      title: "Damage Reports",
      value: formatNumber(stats?.openDamageReports ?? 0),
      subtitle: "awaiting review",
      icon: <DamageIcon />,
      variant: "danger",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-text">
          Welcome back{user?.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-1 text-sm text-subtle">
          Here&apos;s what&apos;s happening with your fleet today.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-danger/20 bg-danger-tint-6 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <StatsCard
            key={card.title}
            title={card.title}
            value={card.value}
            subtitle={card.subtitle}
            icon={card.icon}
            variant={card.variant}
            loading={loading}
          />
        ))}
      </div>

      {/* Widgets */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentBookings bookings={overview?.recentBookings ?? []} loading={loading} />
        <VehicleStatusWidget data={overview?.vehicleStatus ?? null} loading={loading} />
      </div>
    </div>
  );
}
