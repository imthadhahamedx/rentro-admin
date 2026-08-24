// app/(dashboard)/payments/[paymentId]/page.tsx
// NOTE: rename this folder from "paymentId" to "[paymentId]" in your project.
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  getPaymentById,
  formatCurrency,
  getErrorMessage,
  PAYMENT_METHOD_LABELS,
  PAYMENT_TYPE_LABELS,
  PaymentDetail,
} from "@/service/paymentService";

export default function PaymentDetailPage() {
  const { paymentId } = useParams<{ paymentId: string }>();
  const searchParams = useSearchParams();
  const returnStatus = searchParams.get("status"); // "success" | "cancel" from PayHere redirect

  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const data = await getPaymentById(paymentId);
        if (!cancelled) setPayment(data);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, "Failed to load payment."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [paymentId]);

  if (loading) {
    return <PageShell><p style={{ color: "var(--color-subtle)" }}>Loading payment…</p></PageShell>;
  }

  if (error || !payment) {
    return (
      <PageShell>
        <p style={{ color: "var(--color-danger)" }}>{error ?? "Payment not found."}</p>
        <Link href="/payments" style={{ color: "var(--color-info)" }}>← Back to Payments</Link>
      </PageShell>
    );
  }

  const statusColor = {
    COMPLETED: "var(--color-green)",
    PENDING:   "var(--color-warning)",
    FAILED:    "var(--color-danger)",
    REFUNDED:  "var(--color-secondary)",
  }[payment.status] ?? "var(--color-subtle)";

  return (
    <PageShell>
      {/* PayHere redirect banner */}
      {returnStatus === "success" && (
        <div style={{ ...alertBase, background: "var(--color-green-tint-10)", borderColor: "var(--color-green)", color: "var(--color-green)", marginBottom: "1.25rem" }}>
          ✅ Payment submitted to PayHere. Status will update once confirmed.
        </div>
      )}
      {returnStatus === "cancel" && (
        <div style={{ ...alertBase, background: "var(--color-danger-tint-6)", borderColor: "var(--color-danger-tint-20)", color: "var(--color-danger)", marginBottom: "1.25rem" }}>
          ⚠️ Payment was cancelled or not completed.
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link href="/payments" style={{ color: "var(--color-subtle)", textDecoration: "none", fontSize: "0.875rem" }}>
            ← Payments
          </Link>
          <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text)" }}>
            {payment.paymentRef}
          </h1>
          <span style={{ padding: "0.25rem 0.625rem", borderRadius: 20, fontSize: "0.75rem", fontWeight: 600, background: `${statusColor}22`, color: statusColor }}>
            {payment.status}
          </span>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {payment.status === "COMPLETED" && (
            <Link
              href={`/payments/${paymentId}/refund`}
              style={{ ...btnOutline, textDecoration: "none", display: "inline-block" }}
            >
              Refund
            </Link>
          )}
          <Link
            href={`/payments/new?bookingId=${payment.bookingId}`}
            style={{ ...btnPrimary, textDecoration: "none", display: "inline-block" }}
          >
            + New Payment
          </Link>
        </div>
      </div>

      {/* Amount hero */}
      <div
        style={{
          background: "var(--color-bg)",
          border: "1px solid var(--color-border)",
          borderRadius: 10,
          padding: "1.5rem",
          marginBottom: "1.25rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-subtle)" }}>
            {PAYMENT_TYPE_LABELS[payment.paymentType] ?? payment.paymentType}
          </p>
          <p style={{ margin: "0.25rem 0 0", fontSize: "2rem", fontWeight: 700, color: "var(--color-text)" }}>
            {formatCurrency(payment.amount)}
          </p>
        </div>
        <div style={{ textAlign: "right", fontSize: "0.875rem" }}>
          <p style={{ margin: 0, color: "var(--color-subtle)" }}>Method</p>
          <p style={{ margin: "0.25rem 0 0", fontWeight: 600 }}>
            {PAYMENT_METHOD_LABELS[payment.paymentMethod] ?? payment.paymentMethod}
          </p>
        </div>
      </div>

      {/* Details grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.25rem" }}>
        <Card title="Payment Info">
          <DetailRow label="Payment Ref" value={payment.paymentRef} />
          <DetailRow label="Transaction ID" value={payment.transactionId ?? "—"} />
          <DetailRow label="Paid At" value={payment.paidAt ? fmtDate(payment.paidAt) : "—"} />
          <DetailRow label="Created At" value={fmtDate(payment.createdAt)} />
          <DetailRow label="Processed By" value={payment.processedByName ?? "—"} />
          {payment.notes && <DetailRow label="Notes" value={payment.notes} />}
        </Card>

        <Card title="Booking Summary">
          <DetailRow label="Booking Ref" value={payment.bookingRef} linkHref={`/booking/${payment.bookingId}`} />
          <DetailRow label="Customer" value={payment.customerName} />
          <DetailRow label="Phone Number" value={payment.customerPhoneNumber ?? "—"} />
          <DetailRow label="Vehicle" value={`${payment.vehicleName} (${payment.vehicleRegNo})`} />
          <DetailRow label="Final Amount" value={formatCurrency(payment.bookingFinalAmount)} />
          <DetailRow label="Total Paid" value={formatCurrency(payment.bookingTotalPaid)} />
          <DetailRow
            label="Balance Due"
            value={formatCurrency(payment.bookingBalanceDue)}
            highlight={payment.bookingBalanceDue > 0}
          />
        </Card>
      </div>

      {/* Gateway response (collapsed) */}
      {payment.gatewayResponse && (
        <details
          style={{
            background: "var(--color-bg)",
            border: "1px solid var(--color-border)",
            borderRadius: 10,
            padding: "1rem 1.5rem",
          }}
        >
          <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: "0.9375rem" }}>
            Gateway Response (raw)
          </summary>
          <pre
            style={{
              marginTop: "0.75rem",
              fontSize: "0.75rem",
              color: "var(--color-subtle)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
            }}
          >
            {JSON.stringify(JSON.parse(payment.gatewayResponse), null, 2)}
          </pre>
        </details>
      )}
    </PageShell>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1rem" }}>
      {children}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--color-bg)",
        border: "1px solid var(--color-border)",
        borderRadius: 10,
        padding: "1.25rem 1.5rem",
      }}
    >
      <h3 style={{ margin: "0 0 1rem", fontSize: "0.9375rem", fontWeight: 600 }}>{title}</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>{children}</div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  highlight,
  linkHref,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  linkHref?: string;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
      <span style={{ color: "var(--color-subtle)" }}>{label}</span>
      {linkHref ? (
        <Link href={linkHref} style={{ color: "var(--color-info)", textDecoration: "none", fontWeight: 500 }}>
          {value}
        </Link>
      ) : (
        <span style={{ fontWeight: 500, color: highlight ? "var(--color-danger)" : "var(--color-text)" }}>
          {value}
        </span>
      )}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const alertBase: React.CSSProperties = {
  padding: "0.75rem 1rem",
  borderRadius: 6,
  border: "1px solid",
  fontSize: "0.875rem",
};

const btnPrimary: React.CSSProperties = {
  padding: "0.5rem 1rem",
  background: "var(--color-info)",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  fontWeight: 600,
  cursor: "pointer",
  fontSize: "0.875rem",
};

const btnOutline: React.CSSProperties = {
  padding: "0.5rem 1rem",
  background: "transparent",
  color: "var(--color-danger)",
  border: "1px solid var(--color-danger-tint-20)",
  borderRadius: 6,
  fontWeight: 500,
  cursor: "pointer",
  fontSize: "0.875rem",
};
