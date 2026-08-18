// app/(dashboard)/customers/[customerId]/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  CustomerDetail,
  getCustomerById,
  updateCustomerStatus,
  deleteCustomer,
  getErrorMessage,
} from "@/service/customerService";
import CustomerStatusBadge from "../../_components/CustomerStatusBadge";
import RoleGate from "../../_components/RoleGate";

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-LK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

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

function isExpiringSoon(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  const days = (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return days >= 0 && days <= 30;
}

function isExpired(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  return new Date(dateStr).getTime() < Date.now();
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

function AvatarInitials({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
      {initials || "?"}
    </div>
  );
}

export default function CustomerDetailPage() {
  const params = useParams<{ customerId: string }>();
  const router = useRouter();
  const customerId = params.customerId;

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
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
      const data = await getCustomerById(customerId);
      setCustomer(data);
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't load this customer."));
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleToggleStatus() {
    if (!customer) return;
    try {
      setStatusSaving(true);
      setStatusError(null);
      const nextActive = !customer.isActive;
      await updateCustomerStatus(customerId, nextActive);
      setCustomer((prev) => (prev ? { ...prev, isActive: nextActive } : prev));
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
      await deleteCustomer(customerId);
      router.push("/customers");
    } catch (err) {
      setDeleteError(getErrorMessage(err, "Couldn't delete this customer."));
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

  if (error || !customer) {
    return (
      <div className="space-y-4">
        <Link href="/customers" className="text-xs font-medium text-info hover:underline">
          ← Back to customers
        </Link>
        <div className="rounded-lg border border-danger/20 bg-danger-tint-6 px-4 py-3 text-sm text-danger">
          {error ?? "Customer not found."}
        </div>
      </div>
    );
  }

  const primaryAddress = customer.addresses?.[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/customers" className="text-xs font-medium text-info hover:underline">
          ← Back to customers
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AvatarInitials name={customer.fullName} />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-text">{customer.fullName}</h1>
                <CustomerStatusBadge isActive={customer.isActive} />
              </div>
              <p className="text-xs text-subtle">Customer since {formatDate(customer.createdAt)}</p>
            </div>
          </div>

          <RoleGate allow={["STAFF", "ADMIN", "SUPER_ADMIN"]}>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/customers/${customer.id}/bookings`}
                className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-text hover:bg-body"
              >
                Booking History
              </Link>
              <Link
                href={`/customers/${customer.id}/edit`}
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
            Delete {customer.fullName}&apos;s account? This is only possible when the customer has no bookings on
            record. This cannot be undone.
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
          <SectionCard title="Contact Details">
            <Row label="Full Name" value={customer.fullName} />
            <Row label="Email" value={customer.email} />
            <Row label="Phone" value={customer.phoneNumber} />
            <Row label="Date of Birth" value={formatDate(customer.dateOfBirth)} />
          </SectionCard>

          <SectionCard title="Identification & Licence">
            <Row label="NIC" value={customer.nic} />
            <Row label="Driving Licence No" value={customer.drivingLicenseNo} />
            <Row
              label="Licence Expiry"
              value={
                <span
                  className={
                    isExpired(customer.licenseExpiryDate)
                      ? "text-danger"
                      : isExpiringSoon(customer.licenseExpiryDate)
                      ? "text-warning"
                      : "text-text"
                  }
                >
                  {formatDate(customer.licenseExpiryDate)}
                  {isExpired(customer.licenseExpiryDate) && " (expired)"}
                  {!isExpired(customer.licenseExpiryDate) && isExpiringSoon(customer.licenseExpiryDate) && " (expiring soon)"}
                </span>
              }
            />
          </SectionCard>

          <SectionCard title="Address">
            {primaryAddress ? (
              <div className="space-y-1 text-sm text-text">
                <p>{primaryAddress.address || "—"}</p>
                <p className="text-subtle">
                  {[primaryAddress.city, primaryAddress.country].filter(Boolean).join(", ") || "—"}
                </p>
              </div>
            ) : (
              <p className="text-sm text-subtle">No address on file.</p>
            )}
          </SectionCard>

          <SectionCard title="Notes">
            {customer.notes ? (
              <p className="whitespace-pre-wrap text-sm text-text">{customer.notes}</p>
            ) : (
              <p className="text-sm text-subtle">No notes recorded for this customer.</p>
            )}
          </SectionCard>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <SectionCard title="Account Status">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text">
                  {customer.isActive ? "Active — can make bookings" : "Inactive — bookings blocked"}
                </span>
                <CustomerStatusBadge isActive={customer.isActive} />
              </div>
              <RoleGate allow={["STAFF", "ADMIN", "SUPER_ADMIN"]}>
                <button
                  onClick={handleToggleStatus}
                  disabled={statusSaving}
                  className={`w-full rounded-lg border px-3 py-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-60 ${
                    customer.isActive
                      ? "border-danger/30 text-danger hover:bg-danger-tint-6"
                      : "border-green-tint-10 text-green hover:bg-green-tint-10"
                  }`}
                >
                  {statusSaving ? "Saving..." : customer.isActive ? "Deactivate Account" : "Activate Account"}
                </button>
              </RoleGate>
              {statusError && <p className="text-xs text-danger">{statusError}</p>}
              <Row label="Email Verified" value={customer.emailVerified ? "Yes" : "No"} />
            </div>
          </SectionCard>

          <SectionCard
            title="Bookings"
            action={
              <Link href={`/customers/${customer.id}/bookings`} className="text-xs font-medium text-info hover:underline">
                View all
              </Link>
            }
          >
            <Row label="Total Bookings" value={customer.totalBookings} />
          </SectionCard>

          <SectionCard title="Record">
            <Row label="Created" value={formatDateTime(customer.createdAt)} />
            <Row label="Last Updated" value={formatDateTime(customer.updatedAt)} />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
