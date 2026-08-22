// app/(dashboard)/reports/damage/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DamageReportSummary,
  getDamageReport,
  getErrorMessage,
} from "@/service/reportService";
import ReportDateRangeFilter, { monthsAgoStart, toIsoDate } from "../_components/ReportDateRangeFilter";
import ReportStatCard from "../_components/ReportStatCard";
import MonthlyTrendChart from "../_components/MonthlyTrendChart";
import BreakdownBarList from "../_components/BreakdownBarList";

function DamageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M12 3 2 20h20L12 3Z" />
      <path d="M12 10v4M12 17h.01" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16h.01" />
    </svg>
  );
}

export default function DamageReportPage() {
  const [startDate, setStartDate] = useState(() => monthsAgoStart(12));
  const [endDate, setEndDate] = useState(() => toIsoDate(new Date()));
  const [report, setReport] = useState<DamageReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDamageReport({ startDate, endDate });
      setReport(data);
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't load the damage report. Please try again."));
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
        <h1 className="text-xl font-bold text-text">Damage Report</h1>
        <p className="mt-1 text-sm text-subtle">Damage volume, responsible party, and outstanding repairs.</p>
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
          label="Total Damages"
          value={(report?.totalDamages ?? 0).toLocaleString("en-LK")}
          subtitle={`${report?.startDate ?? ""} → ${report?.endDate ?? ""}`}
          icon={<DamageIcon />}
          loading={loading}
        />
        <ReportStatCard
          label="Fixed"
          value={(report?.fixedCount ?? 0).toLocaleString("en-LK")}
          subtitle="Marked resolved"
          icon={<CheckIcon />}
          loading={loading}
        />
        <ReportStatCard
          label="Outstanding"
          value={(report?.unfixedCount ?? 0).toLocaleString("en-LK")}
          subtitle="Still needs repair"
          icon={<AlertIcon />}
          loading={loading}
        />
      </div>

      <MonthlyTrendChart
        title="Damages Over Time"
        data={report?.monthlyDamages ?? []}
        metric="count"
        loading={loading}
      />

      <BreakdownBarList
        title="By Damage Cause"
        rows={(report?.byDamageBy ?? []).map((r) => ({ label: r.label, value: r.count }))}
        loading={loading}
      />

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
        <div className="border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold text-text">Most Damaged Vehicles</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-body/50 text-xs uppercase tracking-wide text-subtle">
              <tr>
                <th className="px-5 py-3 font-medium">Vehicle</th>
                <th className="px-5 py-3 font-medium">Total Damages</th>
                <th className="px-5 py-3 font-medium">Outstanding</th>
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

              {!loading && (report?.topDamagedVehicles.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-10 text-center text-sm text-subtle">
                    No damage recorded for this period.
                  </td>
                </tr>
              )}

              {!loading &&
                report?.topDamagedVehicles.map((v) => (
                  <tr key={v.vehicleId}>
                    <td className="px-5 py-3">
                      <p className="font-medium text-text">{v.vehicleName}</p>
                      <p className="text-xs text-subtle">{v.regNo}</p>
                    </td>
                    <td className="px-5 py-3 text-text">{v.damageCount}</td>
                    <td className="px-5 py-3">
                      {v.unfixedCount > 0 ? (
                        <span className="rounded-full bg-danger-tint-6 px-2 py-0.5 text-xs font-medium text-danger">
                          {v.unfixedCount} unresolved
                        </span>
                      ) : (
                        <span className="rounded-full bg-green-tint-10 px-2 py-0.5 text-xs font-medium text-green">
                          All fixed
                        </span>
                      )}
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
