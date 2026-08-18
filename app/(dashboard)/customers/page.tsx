// app/(dashboard)/customers/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CustomerListItem,
  getCustomers,
  getErrorMessage,
} from "@/service/customerService";
import CustomerStatusBadge from "../_components/CustomerStatusBadge";
import RoleGate from "../_components/RoleGate";

const STATUS_FILTERS: { label: string; value: "" | "true" | "false" }[] = [
  { label: "All", value: "" },
  { label: "Active", value: "true" },
  { label: "Inactive", value: "false" },
];

const PAGE_SIZE = 10;

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-LK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
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

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3-3" />
    </svg>
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
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
      {initials || "?"}
    </div>
  );
}

export default function CustomersPage() {
  const router = useRouter();

  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<"" | "true" | "false">("");
  const [searchInput, setSearchInput] = useState("");
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getCustomers({
        searchText,
        isActive: statusFilter === "" ? undefined : statusFilter === "true",
        page,
        size: PAGE_SIZE,
      });
      setCustomers(result.dataList ?? []);
      setCount(result.count ?? 0);
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't load customers. Please try again."));
      setCustomers([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, [searchText, statusFilter, page]);

  useEffect(() => {
    load();
  }, [load]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(0);
    setSearchText(searchInput.trim());
  }

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-text">Customers</h1>
          <p className="mt-1 text-sm text-subtle">Manage customer accounts, licences, and rental history.</p>
        </div>
        <RoleGate allow={["STAFF", "ADMIN", "SUPER_ADMIN"]}>
          <Link
            href="/customers/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
          >
            <PlusIcon />
            New Customer
          </Link>
        </RoleGate>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <form onSubmit={handleSearchSubmit} className="flex w-full max-w-sm items-center gap-2">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle">
              <SearchIcon />
            </span>
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name, phone, email, NIC..."
              className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm text-text placeholder:text-subtle focus:border-info focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-text hover:bg-body"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => {
                setStatusFilter(f.value);
                setPage(0);
              }}
              className="rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                backgroundColor: statusFilter === f.value ? "var(--color-primary)" : "var(--color-surface)",
                color: statusFilter === f.value ? "#fff" : "var(--color-subtle)",
                border: "1px solid var(--color-border)",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-danger/20 bg-danger-tint-6 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-body/50 text-xs uppercase tracking-wide text-subtle">
              <tr>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Contact</th>
                <th className="px-5 py-3 font-medium">NIC / Licence</th>
                <th className="px-5 py-3 font-medium">Licence Expiry</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`skeleton-${i}`}>
                    <td colSpan={5} className="px-5 py-4">
                      <div className="h-4 w-full animate-pulse rounded bg-border" />
                    </td>
                  </tr>
                ))}

              {!loading && customers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-subtle">
                    No customers found.
                  </td>
                </tr>
              )}

              {!loading &&
                customers.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/customers/${c.id}`)}
                    className="cursor-pointer transition-colors hover:bg-body"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <AvatarInitials name={c.fullName} />
                        <div>
                          <p className="font-medium text-text">{c.fullName}</p>
                          <p className="text-xs text-subtle">
                            Customer since {formatDate(c.createdAt)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-text">
                      <p>{c.phoneNumber}</p>
                      <p className="text-xs text-subtle">{c.email}</p>
                    </td>
                    <td className="px-5 py-4 text-text">
                      <p>{c.nic}</p>
                      <p className="text-xs text-subtle">{c.drivingLicenseNo}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={
                          isExpired(c.licenseExpiryDate)
                            ? "font-medium text-danger"
                            : isExpiringSoon(c.licenseExpiryDate)
                            ? "font-medium text-warning"
                            : "text-text"
                        }
                      >
                        {formatDate(c.licenseExpiryDate)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <CustomerStatusBadge isActive={c.isActive} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <p className="text-xs text-subtle">
            {count === 0 ? "0 results" : `Page ${page + 1} of ${totalPages} · ${count} results`}
          </p>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text disabled:cursor-not-allowed disabled:opacity-40 hover:bg-body"
            >
              Previous
            </button>
            <button
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text disabled:cursor-not-allowed disabled:opacity-40 hover:bg-body"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
