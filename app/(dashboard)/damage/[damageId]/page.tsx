// app/(dashboard)/damage/[damageId]/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  DamageDetail,
  getDamageById,
  updateDamageFixedStatus,
  deleteDamage,
  getErrorMessage,
} from "@/service/damageService";
import DamageStatusBadge from "../../_components/DamageStatusBadge";
import DamageImageGrid from "../../_components/DamageImageGrid";
import RoleGate from "../../_components/RoleGate";

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

function SectionCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
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
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-subtle">{label}</span>
      <span className="font-medium text-text">{value}</span>
    </div>
  );
}

export default function DamageDetailPage() {
  const params = useParams<{ damageId: string }>();
  const router = useRouter();
  const damageId = params.damageId;

  const [damage, setDamage] = useState<DamageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusSaving, setStatusSaving] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDamageById(damageId);
      setDamage(data);
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't load this damage record."));
    } finally {
      setLoading(false);
    }
  }, [damageId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleToggleFixed() {
    if (!damage) return;
    const nextIsFixed = !damage.isFixed;
    try {
      setStatusSaving(true);
      setStatusError(null);
      await updateDamageFixedStatus(damageId, { isFixed: nextIsFixed });
      setDamage((prev) => (prev ? { ...prev, isFixed: nextIsFixed, fixedAt: nextIsFixed ? new Date().toISOString() : null } : prev));
    } catch (err) {
      setStatusError(getErrorMessage(err, "Couldn't update status."));
    } finally {
      setStatusSaving(false);
    }
  }

  async function handleDelete() {
    try {
      setDeleting(true);
      setDeleteError(null);
      await deleteDamage(damageId);
      router.push("/damage");
    } catch (err) {
      setDeleteError(getErrorMessage(err, "Couldn't delete this damage record."));
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

  if (error || !damage) {
    return (
      <div className="space-y-4">
        <Link href="/damage" className="text-xs font-medium text-info hover:underline">
          ← Back to damage records
        </Link>
        <div className="rounded-lg border border-danger/20 bg-danger-tint-6 px-4 py-3 text-sm text-danger">
          {error ?? "Damage record not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/damage" className="text-xs font-medium text-info hover:underline">
          ← Back to damage records
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-text">{damage.vehicleLabel}</h1>
            <DamageStatusBadge isFixed={damage.isFixed} />
          </div>

          <RoleGate allow={["STAFF", "ADMIN", "SUPER_ADMIN"]}>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/damage/${damage.id}/images`}
                className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-text hover:bg-body"
              >
                Manage Photos
              </Link>
              <Link
                href={`/damage/${damage.id}/edit`}
                className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white hover:opacity-90"
              >
                Edit
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
          </RoleGate>
        </div>
      </div>

      {deleteError && (
        <div className="rounded-lg border border-danger/20 bg-danger-tint-6 px-4 py-3 text-sm text-danger">{deleteError}</div>
      )}

      {showDeleteConfirm && (
        <div className="rounded-xl border border-danger/30 bg-danger-tint-6 p-5">
          <p className="text-sm font-medium text-text">
            Delete this damage record for {damage.vehicleLabel}? This removes the record and all of its photos. This cannot be undone.
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
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          <SectionCard title="Damage Description">
            <p className="whitespace-pre-wrap text-sm text-text">{damage.description}</p>
          </SectionCard>

          <SectionCard title="Photos" action={<span className="text-xs text-subtle">{damage.images.length} total</span>}>
            <DamageImageGrid images={damage.images} emptyLabel="No photos have been uploaded for this damage record." />
          </SectionCard>

          {damage.remark && (
            <SectionCard title="Internal Remark">
              <p className="whitespace-pre-wrap text-sm text-text">{damage.remark}</p>
            </SectionCard>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <SectionCard title="Status">
            <div className="space-y-3">
              <button
                onClick={handleToggleFixed}
                disabled={statusSaving}
                className={`w-full rounded-lg px-3 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  damage.isFixed ? "bg-warning hover:opacity-90" : "bg-green hover:opacity-90"
                }`}
              >
                {statusSaving ? "Saving..." : damage.isFixed ? "Mark as Open" : "Mark as Fixed"}
              </button>
              {statusError && <p className="text-xs text-danger">{statusError}</p>}
            </div>
          </SectionCard>

          <SectionCard title="Vehicle">
            <Row label="Vehicle" value={damage.vehicleLabel} />
            <Row label="Registration No" value={damage.vehicleRegNo} />
          </SectionCard>

          <SectionCard title="Record">
            <Row label="Reported By" value={damage.damageBy} />
            <Row label="Marked By" value={damage.markedByName ?? "—"} />
            <Row label="Reported On" value={formatDateTime(damage.createdAt)} />
            <Row label="Fixed On" value={formatDateTime(damage.fixedAt)} />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
