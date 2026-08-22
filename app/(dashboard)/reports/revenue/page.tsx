// app/(dashboard)/reports/revenue/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  RevenueReport,
  getRevenueReport,
  getErrorMessage,
} from "@/service/reportService";
import ReportDateRangeFilter, { monthsAgoStart, toIsoDate } from "../_components/ReportDateRangeFilter";
import ReportStatCard from "../_components/ReportStatCard";
import MonthlyTrendChart from "../_components/MonthlyTrendChart";
import BreakdownBarList from "../_components/BreakdownBarList";

function formatCurrency(amount: number): string {
  return `Rs. ${(amount ?? 0).toLocaleString("en-LK", { maximumFractionDigits: 0 })}`;
}

function RevenueIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M9 9.5c0-1.4 1.3-2.5 3-2.5s3 .9 3 2c0 3-6 1.5-6 4.5 0 1.1 1.3 2 3 2s3-1.1 3-2.5" />
    </svg>
  );
}

function ReceiptIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2Z" />
      <path d="M9 8h6M9 12h6" />
    </svg>
  );
}

function AverageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M3 17l5-5 4 4 8-9" />
    </svg>
  );
}

export default function RevenueReportPage() {
  const [startDate, setStartDate] = useState(() => monthsAgoStart(12));
  const [endDate, setEndDate] = useState(() => toIsoDate(new Date()));
  const [report, setReport] = useState<RevenueReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getRevenueReport({ startDate, endDate });
      setReport(data);
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't load the revenue report. Please try again."));
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
        <h1 className="text-xl font-bold text-text">Revenue Report</h1>
        <p className="mt-1 text-sm text-subtle">Completed payments, breakdowns, and top-earning vehicles.</p>
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

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ReportStatCard
          label="Total Revenue"
          value={formatCurrency(report?.totalRevenue ?? 0)}
          subtitle={`${report?.startDate ?? ""} → ${report?.endDate ?? ""}`}
          icon={<RevenueIcon />}
          loading={loading}
        />
        <ReportStatCard
          label="Completed Payments"
          value={(report?.totalPayments ?? 0).toLocaleString("en-LK")}
          subtitle="Payments counted"
          icon={<ReceiptIcon />}
          loading={loading}
        />
        <ReportStatCard
          label="Average Payment"
          value={formatCurrency(report?.averagePaymentAmount ?? 0)}
          subtitle="Per completed payment"
          icon={<AverageIcon />}
          loading={loading}
        />
      </div>

      {/* Trend */}
      <MonthlyTrendChart
        title="Monthly Revenue"
        data={report?.monthlyRevenue ?? []}
        metric="amount"
        formatValue={formatCurrency}
        loading={loading}
      />

      {/* Breakdowns */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BreakdownBarList
          title="By Payment Method"
          rows={(report?.byPaymentMethod ?? []).map((r) => ({ label: r.label, value: r.amount, secondary: `${r.count} payments` }))}
          formatValue={formatCurrency}
          loading={loading}
        />
        <BreakdownBarList
          title="By Payment Type"
          rows={(report?.byPaymentType ?? []).map((r) => ({ label: r.label, value: r.amount, secondary: `${r.count} payments` }))}
          formatValue={formatCurrency}
          loading={loading}
        />
      </div>

      {/* Top vehicles */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
        <div className="border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold text-text">Top Vehicles by Revenue</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-body/50 text-xs uppercase tracking-wide text-subtle">
              <tr>
                <th className="px-5 py-3 font-medium">Vehicle</th>
                <th className="px-5 py-3 font-medium">Bookings</th>
                <th className="px-5 py-3 font-medium">Revenue</th>
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

              {!loading && (report?.topVehicles.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-10 text-center text-sm text-subtle">
                    No revenue recorded for this period.
                  </td>
                </tr>
              )}

              {!loading &&
                report?.topVehicles.map((v) => (
                  <tr key={v.vehicleId}>
                    <td className="px-5 py-3">
                      <p className="font-medium text-text">{v.vehicleName}</p>
                      <p className="text-xs text-subtle">{v.regNo}</p>
                    </td>
                    <td className="px-5 py-3 text-text">{v.bookingsCount}</td>
                    <td className="px-5 py-3 font-semibold text-text">{formatCurrency(v.revenue)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
