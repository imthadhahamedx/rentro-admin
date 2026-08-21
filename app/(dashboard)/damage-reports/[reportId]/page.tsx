// app/(dashboard)/damage-reports/[reportId]/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  DamageReportDetail,
  getDamageReportById,
  deleteDamageReport,
  getErrorMessage,
} from "@/service/damageReportService";
import DamageImageGrid from "../../_components/DamageImageGrid";
import RoleGate from "../../_components/RoleGate";
import DamageStatusBadge from "../../_components/DamageStatusBadge";

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

function SectionCard({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
      <span className="shrink-0 text-subtle">{label}</span>
      <span className="text-right font-medium text-text">{value}</span>
    </div>
  );
}

function ReviewedBadge({ reviewed }: { reviewed: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        reviewed ? "bg-green-tint-10 text-green" : "bg-warning/10 text-warning"
      }`}
    >
      {reviewed ? "Reviewed" : "Pending Review"}
    </span>
  );
}

export default function DamageReportDetailPage() {
  const params = useParams<{ reportId: string }>();
  const router = useRouter();
  const reportId = params.reportId;

  const [report, setReport] = useState<DamageReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  async function handleDelete() {
    try {
      setDeleting(true);
      setDeleteError(null);
      await deleteDamageReport(reportId);
      router.push("/damage-reports");
    } catch (err) {
      setDeleteError(getErrorMessage(err, "Couldn't delete this damage report."));
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-48 animate-pulse rounded bg-border" />
        <div className="h-40 w-full animate-pulse rounded-xl bg-border" />
        <div className="h-40 w-full animate-pulse rounded-xl bg-border" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="space-y-4">
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/damage-reports" className="text-xs font-medium text-info hover:underline">
          ← Back to damage reports
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold text-text">{report.bookingRef}</h1>
            <ReviewedBadge reviewed={report.reviewed} />
          </div>

          <div className="flex flex-wrap gap-2">
            <RoleGate allow={["STAFF", "ADMIN", "SUPER_ADMIN"]}>
              <Link
                href={`/damage-reports/${report.id}/review`}
                className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white hover:opacity-90"
              >
                {report.reviewed ? "Re-Review" : "Review"}
              </Link>
            </RoleGate>
            <Link
              href={`/damage/${report.damageId}`}
              className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-text hover:bg-body"
            >
              View Damage Record
            </Link>
            <Link
              href={`/bookings/${report.bookingId}`}
              className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-text hover:bg-body"
            >
              View Booking
            </Link>
            <RoleGate allow={["SUPER_ADMIN"]}>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="rounded-lg border border-danger/30 px-3 py-2 text-xs font-medium text-danger hover:bg-danger-tint-6"
              >
                Delete
              </button>
            </RoleGate>
          </div>
        </div>
      </div>

      {deleteError && (
        <div className="rounded-lg border border-danger/20 bg-danger-tint-6 px-4 py-3 text-sm text-danger">
          {deleteError}
        </div>
      )}

      {showDeleteConfirm && (
        <div className="rounded-xl border border-danger/30 bg-danger-tint-6 p-5">
          <p className="text-sm font-medium text-text">
            Delete this damage report for booking {report.bookingRef}? This cannot be undone.
          </p>
          <div className="mt-3 flex gap-3">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Yes, delete"}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deleting}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text hover:bg-body"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left col */}
        <div className="space-y-6 lg:col-span-2">
          <SectionCard title="Damage Details">
            <div className="mb-3 flex items-center gap-2">
              <DamageStatusBadge isFixed={report.damageIsFixed} />
              <span className="rounded-full border border-border bg-body px-2 py-0.5 text-xs text-subtle">
                {report.damageBy}
              </span>
            </div>
            <p className="whitespace-pre-wrap text-sm text-text">{report.damageDescription}</p>
            {report.damageRemark && (
              <div className="mt-4 rounded-lg border border-border bg-body/50 p-3">
                <p className="mb-1 text-xs font-medium text-subtle">Internal Remark</p>
                <p className="whitespace-pre-wrap text-sm text-text">{report.damageRemark}</p>
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Damage Photos"
            action={
              <span className="text-xs text-subtle">{report.damageImages.length} total</span>
            }
          >
            <DamageImageGrid
              images={report.damageImages}
              emptyLabel="No photos attached to this damage record."
            />
          </SectionCard>
        </div>

        {/* Right col */}
        <div className="space-y-6">
          <SectionCard title="Review Status">
            <Row label="Status" value={<ReviewedBadge reviewed={report.reviewed} />} />
            {report.reviewed && (
              <Row label="Reviewed By" value={report.reviewedByName ?? "—"} />
            )}
            <div className="mt-3">
              <Link
                href={`/damage-reports/${report.id}/review`}
                className={`block w-full rounded-lg px-3 py-2 text-center text-sm font-medium text-white transition-colors ${
                  report.reviewed
                    ? "bg-warning hover:opacity-90"
                    : "bg-green hover:opacity-90"
                }`}
              >
                {report.reviewed ? "Re-Review" : "Mark as Reviewed"}
              </Link>
            </div>
          </SectionCard>

          <SectionCard title="Booking">
            <Row label="Ref" value={report.bookingRef} />
            <Row label="Status" value={report.bookingStatus ?? "—"} />
            <Row label="Pickup" value={formatDate(report.pickupDate)} />
            <Row label="Drop-off" value={formatDate(report.dropoffDate)} />
          </SectionCard>

          <SectionCard title="Customer">
            <Row label="Name" value={report.customerName ?? "—"} />
            <Row label="Phone" value={report.customerPhone ?? "—"} />
          </SectionCard>

          <SectionCard title="Vehicle">
            <Row label="Vehicle" value={report.vehicleLabel} />
            <Row label="Reg No" value={report.vehicleRegNo} />
          </SectionCard>

          <SectionCard title="Record">
            <Row label="Reported On" value={formatDateTime(report.date)} />
            <Row label="Damage Logged" value={formatDateTime(report.damageCreatedAt)} />
            <Row label="Fixed On" value={formatDateTime(report.damageFixedAt)} />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
