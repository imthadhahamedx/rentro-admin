// app/(dashboard)/payments/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getPayments,
  formatCurrency,
  getErrorMessage,
  PAYMENT_METHOD_LABELS,
  PAYMENT_TYPE_LABELS,
  PaymentListItem,
  PaymentStatus,
} from "@/service/paymentService";

const STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: "All", value: "" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Pending", value: "PENDING" },
  { label: "Failed", value: "FAILED" },
  { label: "Refunded", value: "REFUNDED" },
];

const STATUS_COLORS: Record<PaymentStatus, string> = {
  COMPLETED: "var(--color-green)",
  PENDING:   "var(--color-warning)",
  FAILED:    "var(--color-danger)",
  REFUNDED:  "var(--color-secondary)",
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getPayments({ searchText, status: statusFilter || undefined });
        if (!cancelled) setPayments(data);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, "Failed to load payments."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [searchText, statusFilter]);

  return (
    <div style={{ padding: "2rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text)" }}>
          Payments
        </h1>
        <Link
          href="/payments/new"
          style={{
            padding: "0.5rem 1.125rem",
            background: "var(--color-info)",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontWeight: 600,
            cursor: "pointer",
            fontSize: "0.9375rem",
            textDecoration: "none",
          }}
        >
          + New Payment
        </Link>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Search by ref, customer, booking…"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{
            flex: "1 1 220px",
            padding: "0.5rem 0.75rem",
            border: "1px solid var(--color-border)",
            borderRadius: 6,
            fontSize: "0.9375rem",
            color: "var(--color-text)",
            background: "var(--color-bg)",
            outline: "none",
          }}
        />
        <div style={{ display: "flex", gap: "0.375rem" }}>
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              style={{
                padding: "0.4375rem 0.875rem",
                border: `1px solid ${statusFilter === opt.value ? "var(--color-info)" : "var(--color-border)"}`,
                borderRadius: 6,
                background: statusFilter === opt.value ? "var(--color-info-tint-12)" : "var(--color-bg)",
                color: statusFilter === opt.value ? "var(--color-info)" : "var(--color-subtle)",
                fontWeight: 500,
                cursor: "pointer",
                fontSize: "0.8125rem",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <p style={{ color: "var(--color-subtle)" }}>Loading…</p>
      ) : error ? (
        <p style={{ color: "var(--color-danger)" }}>{error}</p>
      ) : payments.length === 0 ? (
        <p style={{ color: "var(--color-subtle)" }}>No payments found.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ background: "var(--color-surface)", borderBottom: "1px solid var(--color-border)" }}>
                {["Ref", "Booking", "Customer", "Type", "Method", "Amount", "Status", "Date", ""].map((h) => (
                  <th key={h} style={{ padding: "0.625rem 1rem", textAlign: "left", fontWeight: 600, color: "var(--color-subtle)", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => {
                const color = STATUS_COLORS[p.status] ?? "var(--color-subtle)";
                return (
                  <tr
                    key={p.id}
                    style={{ borderBottom: "1px solid var(--color-border)" }}
                  >
                    <td style={cell}>
                      <Link href={`/payments/${p.id}`} style={{ color: "var(--color-info)", textDecoration: "none", fontWeight: 500 }}>
                        {p.paymentRef}
                      </Link>
                    </td>
                    <td style={cell}>{p.bookingRef}</td>
                    <td style={cell}>{p.customerName}</td>
                    <td style={cell}>{PAYMENT_TYPE_LABELS[p.paymentType] ?? p.paymentType}</td>
                    <td style={cell}>{PAYMENT_METHOD_LABELS[p.paymentMethod] ?? p.paymentMethod}</td>
                    <td style={{ ...cell, fontWeight: 600 }}>{formatCurrency(p.amount)}</td>
                    <td style={cell}>
                      <span style={{ padding: "0.2rem 0.5rem", borderRadius: 12, fontSize: "0.75rem", fontWeight: 600, background: `${color}22`, color }}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ ...cell, whiteSpace: "nowrap", color: "var(--color-subtle)" }}>
                      {p.paidAt ? new Date(p.paidAt).toLocaleDateString("en-LK") : "—"}
                    </td>
                    <td style={cell}>
                      <Link href={`/payments/${p.id}`} style={{ color: "var(--color-info)", textDecoration: "none" }}>
                        View →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const cell: React.CSSProperties = {
  padding: "0.75rem 1rem",
  color: "var(--color-text)",
  verticalAlign: "middle",
};
