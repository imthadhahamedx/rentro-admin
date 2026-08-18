// app/(dashboard)/customers/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createCustomer, getErrorMessage } from "@/service/customerService";

export default function NewCustomerPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [nic, setNic] = useState("");
  const [drivingLicenseNo, setDrivingLicenseNo] = useState("");
  const [licenseExpiryDate, setLicenseExpiryDate] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [notes, setNotes] = useState("");

  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Sri Lanka");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !email.trim() || !password.trim() || !phoneNumber.trim() || !nic.trim() || !drivingLicenseNo.trim() || !licenseExpiryDate) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      setSubmitting(true);
      const hasAddress = address.trim() || city.trim() || country.trim();
      const customer = await createCustomer({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        phoneNumber: phoneNumber.trim(),
        nic: nic.trim(),
        drivingLicenseNo: drivingLicenseNo.trim(),
        licenseExpiryDate,
        dateOfBirth: dateOfBirth || undefined,
        notes: notes.trim() || undefined,
        address: hasAddress
          ? { address: address.trim(), city: city.trim(), country: country.trim() }
          : undefined,
      });
      router.push(`/customers/${customer.id}`);
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't create the customer. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-info focus:outline-none disabled:opacity-60";
  const labelClass = "mb-1.5 block text-xs font-medium text-subtle";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/customers" className="text-xs font-medium text-info hover:underline">
          ← Back to customers
        </Link>
        <h1 className="mt-2 text-xl font-bold text-text">New Customer</h1>
        <p className="mt-1 text-sm text-subtle">Register a new customer account.</p>
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
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} placeholder="e.g. Nimal Perera" required />
            </div>
            <div>
              <label className={labelClass}>Email *</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="name@example.com" required />
            </div>
            <div>
              <label className={labelClass}>Phone *</label>
              <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className={inputClass} placeholder="07XXXXXXXX" required />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Password *</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="Min 8 characters" required />
              <p className="mt-1 text-xs text-subtle">Must include an uppercase, lowercase, digit, and special character.</p>
            </div>
            <div>
              <label className={labelClass}>Date of Birth</label>
              <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-text">Identification & Licence</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>NIC *</label>
              <input value={nic} onChange={(e) => setNic(e.target.value)} className={inputClass} placeholder="e.g. 200012345678" required />
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
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} rows={3} placeholder="Internal notes about this customer (optional)" />
        </div>

        <div className="flex justify-end gap-3">
          <Link href="/customers" className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text hover:bg-body">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create Customer"}
          </button>
        </div>
      </form>
    </div>
  );
}
