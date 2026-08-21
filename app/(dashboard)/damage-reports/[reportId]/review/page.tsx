// app/(dashboard)/damage-reports/[reportId]/review/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  DamageReportDetail,
  getDamageReportById,
  markDamageReportReviewed,
  getErrorMessage,
} from "@/service/damageReportService";
import DamageImageGrid from "../../../_components/DamageImageGrid";
import DamageStatusBadge from "../../../_components/DamageStatusBadge";

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-LK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-LK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
      <span className="shrink-0 text-subtle">{label}</span>
      <span className="text-right font-medium text-text">{value}</span>
    </div>
  );
}

export default function ReviewDamageReportPage() {
  const params = useParams<{ reportId: string }>();
  const router = useRouter();
  const reportId = params.reportId;

  const [report, setReport] = useState<DamageReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDamageReportById(reportId);
      setReport(data);
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't load this damage report."));
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleConfirmReview() {
    try {
      setSubmitting(true);
      setSubmitError(null);
      await markDamageReportReviewed(reportId);
      router.push(`/damage-reports/${reportId}`);
    } catch (err) {
      setSubmitError(getErrorMessage(err, "Couldn't mark report as reviewed."));
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="h-6 w-48 animate-pulse rounded bg-border" />
        <div className="h-64 w-full animate-pulse rounded-xl bg-border" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Link href="/damage-reports" className="text-xs font-medium text-info hover:underline">
          ← Back to damage reports
        </Link>
        <div className="rounded-lg border border-danger/20 bg-danger-tint-6 px-4 py-3 text-sm text-danger">
          {error ?? "Damage report not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/damage-reports/${reportId}`}
          className="text-xs font-medium text-info hover:underline"
        >
          ← Back to damage report
        </Link>
        <h1 className="mt-2 text-xl font-bold text-text">Review Damage Report</h1>
        <p className="mt-1 text-sm text-subtle">
          Review and confirm the damage linked to booking{" "}
          <span className="font-medium text-text">{report.bookingRef}</span>.
        </p>
      </div>

      {/* Already reviewed notice */}
      {report.reviewed && (
        <div className="rounded-lg border border-info/20 bg-info/5 px-4 py-3 text-sm text-info">
          This report was previously reviewed by{" "}
          <span className="font-medium">{report.reviewedByName ?? "a staff member"}</span>. You can
          re-review it below, which will reassign it to your account.
        </div>
      )}

      {/* Summary card */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-text">Summary</h3>
        <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-subtle">Booking</p>
            <Row label="Ref" value={report.bookingRef} />
            <Row label="Status" value={report.bookingStatus ?? "—"} />
            <Row label="Customer" value={report.customerName ?? "—"} />
            <Row label="Phone" value={report.customerPhone ?? "—"} />
            <Row label="Pickup" value={formatDate(report.pickupDate)} />
            <Row label="Drop-off" value={formatDate(report.dropoffDate)} />
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-subtle">Damage</p>
            <Row label="Vehicle" value={report.vehicleLabel} />
            <Row label="Reg No" value={report.vehicleRegNo} />
            <Row
              label="Status"
              value={<DamageStatusBadge isFixed={report.damageIsFixed} />}
            />
            <Row label="Caused By" value={report.damageBy} />
            <Row label="Logged" value={formatDateTime(report.damageCreatedAt)} />
            <Row label="Fixed On" value={formatDateTime(report.damageFixedAt)} />
          </div>
        </div>
      </div>

      {/* Damage description */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-text">Damage Description</h3>
        <p className="whitespace-pre-wrap text-sm text-text">{report.damageDescription}</p>
        {report.damageRemark && (
          <div className="mt-4 rounded-lg border border-border bg-body/50 p-3">
            <p className="mb-1 text-xs font-medium text-subtle">Internal Remark</p>
            <p className="whitespace-pre-wrap text-sm text-text">{report.damageRemark}</p>
          </div>
        )}
      </div>

      {/* Photos */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-text">
          Photos{" "}
          <span className="ml-1 text-xs font-normal text-subtle">
            ({report.damageImages.length})
          </span>
        </h3>
        <DamageImageGrid
          images={report.damageImages}
          emptyLabel="No photos attached to this damage record."
        />
      </div>

      {submitError && (
        <div className="rounded-lg border border-danger/20 bg-danger-tint-6 px-4 py-3 text-sm text-danger">
          {submitError}
        </div>
      )}

      {/* Action */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h3 className="mb-2 text-sm font-semibold text-text">Confirm Review</h3>
        <p className="mb-4 text-sm text-subtle">
          By confirming, you acknowledge that you have reviewed this damage report and all
          associated photos. Your name will be recorded as the reviewer.
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleConfirmReview}
            disabled={submitting}
            className="rounded-lg bg-green px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Confirm Review"}
          </button>
          <Link
            href={`/damage-reports/${reportId}`}
            className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-text hover:bg-body"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
