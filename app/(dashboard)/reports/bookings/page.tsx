// app/(dashboard)/reports/bookings/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BookingsReport,
  getBookingsReport,
  getErrorMessage,
} from "@/service/reportService";
import ReportDateRangeFilter, { monthsAgoStart, toIsoDate } from "../_components/ReportDateRangeFilter";
import ReportStatCard from "../_components/ReportStatCard";
import MonthlyTrendChart from "../_components/MonthlyTrendChart";
import BreakdownBarList from "../_components/BreakdownBarList";

function formatCurrency(amount: number): string {
  return `Rs. ${(amount ?? 0).toLocaleString("en-LK", { maximumFractionDigits: 0 })}`;
}

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

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

export default function BookingsReportPage() {
  const [startDate, setStartDate] = useState(() => monthsAgoStart(12));
  const [endDate, setEndDate] = useState(() => toIsoDate(new Date()));
  const [report, setReport] = useState<BookingsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getBookingsReport({ startDate, endDate });
      setReport(data);
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't load the bookings report. Please try again."));
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text">Bookings Report</h1>
        <p className="mt-1 text-sm text-subtle">Booking volume, status mix, locations, and top customers.</p>
      </div>

      <ReportDateRangeFilter
        startDate={startDate}
        endDate={endDate}
        onChange={(next) => {
          setStartDate(next.startDate);
          setEndDate(next.endDate);
        }}
      />

      {error && (
        <div className="rounded-lg border border-danger/20 bg-danger-tint-6 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ReportStatCard
          label="Total Bookings"
          value={(report?.totalBookings ?? 0).toLocaleString("en-LK")}
          subtitle={`${report?.startDate ?? ""} → ${report?.endDate ?? ""}`}
          icon={<CalendarIcon />}
          loading={loading}
        />
        <ReportStatCard
          label="Booking Revenue"
          value={formatCurrency(report?.totalRevenue ?? 0)}
          subtitle="Final amounts, all statuses"
          icon={<RevenueIcon />}
          loading={loading}
        />
        <ReportStatCard
          label="Average Value"
          value={formatCurrency(report?.averageBookingValue ?? 0)}
          subtitle="Per booking"
          icon={<RevenueIcon />}
          loading={loading}
        />
        <ReportStatCard
          label="Average Duration"
          value={`${(report?.averageDurationDays ?? 0).toFixed(1)} days`}
          subtitle="Per rental"
          icon={<ClockIcon />}
          loading={loading}
        />
      </div>

      <MonthlyTrendChart
        title="Bookings Over Time"
        data={report?.monthlyBookings ?? []}
        metric="count"
        loading={loading}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BreakdownBarList
          title="By Status"
          rows={(report?.byStatus ?? []).map((r) => ({ label: r.label, value: r.count }))}
          loading={loading}
        />
        <BreakdownBarList
          title="By Pickup Location"
          rows={(report?.byPickupLocation ?? []).map((r) => ({ label: r.label, value: r.count }))}
          loading={loading}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
        <div className="border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold text-text">Top Customers</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-body/50 text-xs uppercase tracking-wide text-subtle">
              <tr>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Bookings</th>
                <th className="px-5 py-3 font-medium">Total Spent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={3} className="px-5 py-4">
                      <div className="h-4 w-full animate-pulse rounded bg-border" />
                    </td>
                  </tr>
                ))}

              {!loading && (report?.topCustomers.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-10 text-center text-sm text-subtle">
                    No bookings recorded for this period.
                  </td>
                </tr>
              )}

              {!loading &&
                report?.topCustomers.map((c) => (
                  <tr key={c.customerId}>
                    <td className="px-5 py-3 font-medium text-text">{c.customerName}</td>
                    <td className="px-5 py-3 text-text">{c.bookingsCount}</td>
                    <td className="px-5 py-3 font-semibold text-text">{formatCurrency(c.totalSpent)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
