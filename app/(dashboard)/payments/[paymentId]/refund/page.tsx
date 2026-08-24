// app/(dashboard)/payments/[paymentId]/refund/page.tsx
// NOTE: rename "paymentId" folder to "[paymentId]" in your project.
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getPaymentById,
  refundPayment,
  formatCurrency,
  getErrorMessage,
  PAYMENT_METHOD_LABELS,
  PAYMENT_TYPE_LABELS,
  PaymentDetail,
} from "@/service/paymentService";

export default function RefundPaymentPage() {
  const { paymentId } = useParams<{ paymentId: string }>();
  const router = useRouter();

  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getPaymentById(paymentId);
        if (!cancelled) {
          setPayment(data);
          if (data.status !== "COMPLETED") {
            setLoadError(`Only COMPLETED payments can be refunded. This payment is ${data.status}.`);
          }
        }
      } catch (err) {
        if (!cancelled) setLoadError(getErrorMessage(err, "Failed to load payment."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [paymentId]);

  async function handleRefund() {
    if (!reason.trim()) return setError("Please provide a refund reason.");
    setSubmitting(true);
    setError(null);
    try {
      await refundPayment(paymentId, { reason });
      router.push(`/payments/${paymentId}`);
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={pageWrap}>
        <p style={{ color: "var(--color-subtle)" }}>Loading…</p>
      </div>
    );
  }

  if (loadError || !payment) {
    return (
      <div style={pageWrap}>
        <p style={{ color: "var(--color-danger)", marginBottom: "1rem" }}>
          {loadError ?? "Payment not found."}
        </p>
        <Link href={`/payments/${paymentId}`} style={{ color: "var(--color-info)" }}>
          ← Back to Payment
        </Link>
      </div>
    );
  }

  return (
    <div style={pageWrap}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "2rem", fontSize: "0.875rem", color: "var(--color-subtle)" }}>
        <Link href="/payments" style={{ color: "var(--color-subtle)", textDecoration: "none" }}>Payments</Link>
        <span>/</span>
        <Link href={`/payments/${paymentId}`} style={{ color: "var(--color-subtle)", textDecoration: "none" }}>
          {payment.paymentRef}
        </Link>
        <span>/</span>
        <span style={{ color: "var(--color-text)", fontWeight: 500 }}>Refund</span>
      </div>

      <h1 style={{ margin: "0 0 2rem", fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text)" }}>
        Process Refund
      </h1>

      {/* Payment summary */}
      <div
        style={{
          background: "var(--color-bg)",
          border: "1px solid var(--color-border)",
          borderRadius: 10,
          padding: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        <h2 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 600 }}>Payment Being Refunded</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem 2rem", fontSize: "0.875rem" }}>
          <Row label="Payment Ref" value={payment.paymentRef} />
          <Row label="Customer" value={payment.customerName} />
          <Row label="Amount" value={formatCurrency(payment.amount)} />
          <Row label="Method" value={PAYMENT_METHOD_LABELS[payment.paymentMethod] ?? payment.paymentMethod} />
          <Row label="Type" value={PAYMENT_TYPE_LABELS[payment.paymentType] ?? payment.paymentType} />
          <Row label="Booking" value={payment.bookingRef} />
        </div>
      </div>

      {/* Warning */}
      <div
        style={{
          padding: "1rem 1.25rem",
          background: "var(--color-danger-tint-6)",
          border: "1px solid var(--color-danger-tint-20)",
          borderRadius: 8,
          marginBottom: "1.5rem",
          fontSize: "0.875rem",
          color: "var(--color-danger)",
        }}
      >
        ⚠️ <strong>This action cannot be undone.</strong> The payment status will be changed to{" "}
        <strong>REFUNDED</strong>. Actual funds transfer back to the customer must be handled
        separately through your bank or PayHere dashboard.
      </div>

      {/* Refund form */}
      <div
        style={{
          background: "var(--color-bg)",
          border: "1px solid var(--color-border)",
          borderRadius: 10,
          padding: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        <label style={{ display: "block", fontWeight: 500, fontSize: "0.9375rem", marginBottom: "0.5rem" }}>
          Refund Reason <span style={{ color: "var(--color-danger)" }}>*</span>
        </label>
        <textarea
          rows={4}
          placeholder="Explain why this payment is being refunded…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          style={{
            width: "100%",
            padding: "0.625rem 0.75rem",
            border: "1px solid var(--color-border)",
            borderRadius: 6,
            fontSize: "0.9375rem",
            color: "var(--color-text)",
            background: "var(--color-bg)",
            boxSizing: "border-box",
            resize: "vertical",
            outline: "none",
          }}
        />
      </div>

      {error && (
        <div
          style={{
            padding: "0.75rem 1rem",
            background: "var(--color-danger-tint-6)",
            border: "1px solid var(--color-danger-tint-20)",
            borderRadius: 6,
            color: "var(--color-danger)",
            fontSize: "0.875rem",
            marginBottom: "1rem",
          }}
        >
          {error}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
        <Link
          href={`/payments/${paymentId}`}
          style={{
            padding: "0.625rem 1.25rem",
            background: "var(--color-surface)",
            color: "var(--color-text)",
            border: "1px solid var(--color-border)",
            borderRadius: 6,
            fontWeight: 500,
            textDecoration: "none",
            display: "inline-block",
            fontSize: "0.9375rem",
          }}
        >
          Cancel
        </Link>
        <button
          onClick={handleRefund}
          disabled={submitting || !reason.trim()}
          style={{
            padding: "0.625rem 1.25rem",
            background: submitting ? "var(--color-subtle)" : "var(--color-danger)",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontWeight: 600,
            cursor: submitting ? "not-allowed" : "pointer",
            fontSize: "0.9375rem",
          }}
        >
          {submitting ? "Processing…" : "Confirm Refund"}
        </button>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ color: "var(--color-subtle)", fontSize: "0.75rem" }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );
}

const pageWrap: React.CSSProperties = {
  maxWidth: 680,
  margin: "0 auto",
  padding: "2rem 1rem",
};
