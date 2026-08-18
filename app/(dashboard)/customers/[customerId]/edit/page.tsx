// app/(dashboard)/customers/[customerId]/edit/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getCustomerById, updateCustomer, getErrorMessage } from "@/service/customerService";

function toDateInputValue(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  return dateStr.slice(0, 10);
}

export default function EditCustomerPage() {
  const params = useParams<{ customerId: string }>();
  const router = useRouter();
  const customerId = params.customerId;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [nic, setNic] = useState("");
  const [drivingLicenseNo, setDrivingLicenseNo] = useState("");
  const [licenseExpiryDate, setLicenseExpiryDate] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [notes, setNotes] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const c = await getCustomerById(customerId);
      setFullName(c.fullName);
      setEmail(c.email);
      setPhoneNumber(c.phoneNumber);
      setNic(c.nic);
      setDrivingLicenseNo(c.drivingLicenseNo);
      setLicenseExpiryDate(toDateInputValue(c.licenseExpiryDate));
      setDateOfBirth(toDateInputValue(c.dateOfBirth));
      setNotes(c.notes ?? "");
      const primary = c.addresses?.[0];
      setAddress(primary?.address ?? "");
      setCity(primary?.city ?? "");
      setCountry(primary?.country ?? "");
    } catch (err) {
      setLoadError(getErrorMessage(err, "Couldn't load this customer."));
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !email.trim() || !phoneNumber.trim() || !nic.trim() || !drivingLicenseNo.trim() || !licenseExpiryDate) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      setSubmitting(true);
      const hasAddress = address.trim() || city.trim() || country.trim();
      await updateCustomer(customerId, {
        fullName: fullName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        nic: nic.trim(),
        drivingLicenseNo: drivingLicenseNo.trim(),
        licenseExpiryDate,
        dateOfBirth: dateOfBirth || undefined,
        notes: notes.trim() || undefined,
        password: newPassword.trim() || undefined,
        address: hasAddress
          ? { address: address.trim(), city: city.trim(), country: country.trim() }
          : undefined,
      });
      router.push(`/customers/${customerId}`);
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't update the customer. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-info focus:outline-none disabled:opacity-60";
  const labelClass = "mb-1.5 block text-xs font-medium text-subtle";

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="h-6 w-48 animate-pulse rounded bg-border" />
        <div className="h-64 w-full animate-pulse rounded-xl bg-border" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Link href={`/customers/${customerId}`} className="text-xs font-medium text-info hover:underline">
          ← Back to customer
        </Link>
        <div className="rounded-lg border border-danger/20 bg-danger-tint-6 px-4 py-3 text-sm text-danger">{loadError}</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href={`/customers/${customerId}`} className="text-xs font-medium text-info hover:underline">
          ← Back to customer
        </Link>
        <h1 className="mt-2 text-xl font-bold text-text">Edit Customer</h1>
        <p className="mt-1 text-sm text-subtle">Update {fullName}&apos;s details.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-danger/20 bg-danger-tint-6 px-4 py-3 text-sm text-danger">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-text">Contact Details</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass}>Full Name *</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Email *</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Phone *</label>
              <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Date of Birth</label>
              <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} placeholder="Leave blank to keep current password" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-text">Identification & Licence</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>NIC *</label>
              <input value={nic} onChange={(e) => setNic(e.target.value)} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Driving Licence No *</label>
              <input value={drivingLicenseNo} onChange={(e) => setDrivingLicenseNo(e.target.value)} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Licence Expiry Date *</label>
              <input type="date" value={licenseExpiryDate} onChange={(e) => setLicenseExpiryDate(e.target.value)} className={inputClass} required />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-text">Address</h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className={labelClass}>Address</label>
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} rows={2} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>City</label>
                <input value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Country</label>
                <input value={country} onChange={(e) => setCountry(e.target.value)} className={inputClass} />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-text">Notes</h3>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} rows={3} />
        </div>

        <div className="flex justify-end gap-3">
          <Link href={`/customers/${customerId}`} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text hover:bg-body">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
