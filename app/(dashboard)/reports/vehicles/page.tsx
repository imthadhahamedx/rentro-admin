// app/(dashboard)/reports/vehicles/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  VehiclesReport,
  getVehiclesReport,
  getErrorMessage,
} from "@/service/reportService";
import ReportDateRangeFilter, { monthsAgoStart, toIsoDate } from "../_components/ReportDateRangeFilter";
import ReportStatCard from "../_components/ReportStatCard";
import BreakdownBarList from "../_components/BreakdownBarList";

function formatCurrency(amount: number): string {
  return `Rs. ${(amount ?? 0).toLocaleString("en-LK", { maximumFractionDigits: 0 })}`;
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

function TrendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M3 17l5-5 4 4 8-9" />
    </svg>
  );
}

function utilizationColor(rate: number): string {
  if (rate >= 66) return "bg-green";
  if (rate >= 33) return "bg-warning";
  return "bg-danger";
}

export default function VehiclesReportPage() {
  const [startDate, setStartDate] = useState(() => monthsAgoStart(12));
  const [endDate, setEndDate] = useState(() => toIsoDate(new Date()));
  const [report, setReport] = useState<VehiclesReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getVehiclesReport({ startDate, endDate });
      setReport(data);
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't load the vehicles report. Please try again."));
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    load();
  }, [load]);

  const avgUtilization =
    report && report.utilization.length > 0
      ? report.utilization.reduce((sum, v) => sum + v.utilizationRate, 0) / report.utilization.length
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text">Vehicle Utilization Report</h1>
        <p className="mt-1 text-sm text-subtle">Fleet mix and per-vehicle bookings, revenue, and utilization.</p>
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ReportStatCard
          label="Total Vehicles"
          value={(report?.totalVehicles ?? 0).toLocaleString("en-LK")}
          subtitle="Across the fleet"
          icon={<CarIcon />}
          loading={loading}
        />
        <ReportStatCard
          label="Average Utilization"
          value={`${avgUtilization.toFixed(1)}%`}
          subtitle={`${report?.startDate ?? ""} → ${report?.endDate ?? ""}`}
          icon={<TrendIcon />}
          loading={loading}
        />
        <ReportStatCard
          label="Fleet Revenue"
          value={formatCurrency(report?.utilization.reduce((s, v) => s + v.revenue, 0) ?? 0)}
          subtitle="From bookings in this period"
          icon={<TrendIcon />}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BreakdownBarList
          title="By Status"
          rows={(report?.byStatus ?? []).map((r) => ({ label: r.label, value: r.count }))}
          loading={loading}
        />
        <BreakdownBarList
          title="By Category"
          rows={(report?.byCategory ?? []).map((r) => ({ label: r.label, value: r.count }))}
          loading={loading}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
        <div className="border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold text-text">Per-Vehicle Utilization</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-body/50 text-xs uppercase tracking-wide text-subtle">
              <tr>
                <th className="px-5 py-3 font-medium">Vehicle</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Bookings</th>
                <th className="px-5 py-3 font-medium">Days Booked</th>
                <th className="px-5 py-3 font-medium">Revenue</th>
                <th className="px-5 py-3 font-medium">Utilization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-5 py-4">
                      <div className="h-4 w-full animate-pulse rounded bg-border" />
                    </td>
                  </tr>
                ))}

              {!loading && (report?.utilization.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-subtle">
                    No vehicles found.
                  </td>
                </tr>
              )}

              {!loading &&
                report?.utilization.map((v) => (
                  <tr key={v.vehicleId}>
                    <td className="px-5 py-3">
                      <p className="font-medium text-text">{v.vehicleName}</p>
                      <p className="text-xs text-subtle">{v.regNo}</p>
                    </td>
                    <td className="px-5 py-3 text-text">{v.categoryName}</td>
                    <td className="px-5 py-3 text-text">{v.bookingsCount}</td>
                    <td className="px-5 py-3 text-text">{v.daysBooked}</td>
                    <td className="px-5 py-3 font-semibold text-text">{formatCurrency(v.revenue)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-body">
                          <div
                            className={`h-full rounded-full ${utilizationColor(v.utilizationRate)}`}
                            style={{ width: `${Math.min(100, v.utilizationRate)}%` }}
                          />
                        </div>
                        <span className="text-xs text-subtle">{v.utilizationRate.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
