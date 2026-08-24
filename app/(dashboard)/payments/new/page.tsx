// app/(dashboard)/payments/new/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  recordCashPayment,
  initOnlinePayment,
  getPayhereHash,
  getErrorMessage,
  formatCurrency,
  PAYMENT_TYPE_LABELS,
  PaymentCreatePayload,
} from "@/service/paymentService";
import { getBookingById, getBookingByRef } from "@/service/bookingService";
import type { BookingDetail } from "@/service/bookingService";

// PayHere sandbox JS SDK is loaded dynamically
const PAYHERE_SANDBOX_URL = "https://sandbox.payhere.lk/pay/checkout";
const MERCHANT_ID = "1237649";

// ─── Types ────────────────────────────────────────────────────────────────────
type PayMode = "CASH" | "CARD";

// ─── Component ────────────────────────────────────────────────────────────────
export default function NewPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledBookingId = searchParams.get("bookingId") ?? "";

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [bookingIdInput, setBookingIdInput] = useState(prefilledBookingId);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const [payMode, setPayMode] = useState<PayMode>("CASH");
  const [paymentType, setPaymentType] = useState("RENTAL_FEE");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const payhereFormRef = useRef<HTMLFormElement>(null);

  // Auto-load booking if pre-filled
  useEffect(() => {
    if (prefilledBookingId) {
      loadBooking(prefilledBookingId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefilledBookingId]);

  // Pre-fill amount from balance due when booking loads
  useEffect(() => {
    if (booking && booking.balanceDue > 0) {
      setAmount(booking.balanceDue.toFixed(2));
    }
  }, [booking]);

  async function loadBooking(ref: string) {
    if (!ref.trim()) return;
    setBookingLoading(true);
    setBookingError(null);
    setBooking(null);
    try {
      const data = await getBookingByRef(ref.trim());
      setBooking(data);
    } catch (err) {
      setBookingError(getErrorMessage(err, "Booking not found"));
    } finally {
      setBookingLoading(false);
    }
  }

  // ─── Cash submit ────────────────────────────────────────────────────────────
  async function handleCashSubmit() {
    if (!booking) return setError("Please load a booking first.");
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return setError("Please enter a valid amount.");

    setSubmitting(true);
    setError(null);
    try {
      const payload: PaymentCreatePayload = {
        bookingId: booking.id,
        amount: amt,
        paymentMethod: "CASH",
        paymentType: paymentType as PaymentCreatePayload["paymentType"],
        notes: notes || undefined,
      };
      const paymentId = await recordCashPayment(payload);
      setSuccess("Cash payment recorded successfully!");
      setTimeout(() => router.push(`/payments/${paymentId}`), 1500);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Card / PayHere submit ──────────────────────────────────────────────────
  async function handleCardSubmit() {
    if (!booking) return setError("Please load a booking first.");
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return setError("Please enter a valid amount.");

    setSubmitting(true);
    setError(null);
    try {
      // 1. Create PENDING payment record → get UUID
      const payload: PaymentCreatePayload = {
        bookingId: booking.id,
        amount: amt,
        paymentMethod: "ONLINE",
        paymentType: paymentType as PaymentCreatePayload["paymentType"],
        notes: notes || undefined,
      };
      const paymentId = await initOnlinePayment(payload);

      // 2. Get hash from backend
      const { hash } = await getPayhereHash(paymentId, amt, "LKR");

      // 3. Build PayHere checkout params and submit hidden form
      const customer = booking.customer;
      const formData = {
        merchant_id: MERCHANT_ID,
        return_url: `${window.location.origin}/payments/${paymentId}?status=success`,
        cancel_url: `${window.location.origin}/payments/${paymentId}?status=cancel`,
        notify_url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/payments/payhere/notify`,
        order_id: paymentId,
        items: `${booking.vehicle.make} ${booking.vehicle.model} – ${PAYMENT_TYPE_LABELS[paymentType as keyof typeof PAYMENT_TYPE_LABELS] ?? paymentType}`,
        currency: "LKR",
        amount: amt.toFixed(2),
        first_name: customer.fullName.split(" ")[0] ?? customer.fullName,
        last_name: customer.fullName.split(" ").slice(1).join(" ") || "-",
        email: customer.email,
        phone: customer.phone,
        address: "N/A",
        city: "Colombo",
        country: "Sri Lanka",
        hash,
        custom_1: paymentId, // used by notify webhook
        custom_2: booking.bookingRef,
      };

      // Dynamically inject a hidden form and submit to PayHere sandbox
      const form = document.createElement("form");
      form.method = "POST";
      form.action = PAYHERE_SANDBOX_URL;

      Object.entries(formData).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = String(value);
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  const balanceDue = booking?.balanceDue ?? 0;
  const totalPaid = booking?.totalPaid ?? 0;
  const finalAmount = booking?.finalAmount ?? 0;

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "2rem 1rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <Link
          href="/payments"
          style={{
            color: "var(--color-subtle)",
            textDecoration: "none",
            fontSize: "0.875rem",
          }}
        >
          ← Payments
        </Link>
        <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text)" }}>
          New Payment
        </h1>
      </div>

      {/* Booking lookup */}
      <section
        style={{
          background: "var(--color-bg)",
          border: "1px solid var(--color-border)",
          borderRadius: 10,
          padding: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        <h2 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 600 }}>
          1. Select Booking
        </h2>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <input
            type="text"
            placeholder="Paste booking Ref…"
            value={bookingIdInput}
            onChange={(e) => setBookingIdInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadBooking(bookingIdInput)}
            style={inputStyle}
          />
          <button
            onClick={() => loadBooking(bookingIdInput)}
            disabled={bookingLoading || !bookingIdInput.trim()}
            style={btnPrimary}
          >
            {bookingLoading ? "Loading…" : "Load"}
          </button>
        </div>

        {bookingError && (
          <p style={{ margin: "0.75rem 0 0", color: "var(--color-danger)", fontSize: "0.875rem" }}>
            {bookingError}
          </p>
        )}

        {booking && (
          <div
            style={{
              marginTop: "1rem",
              padding: "1rem",
              background: "var(--color-surface)",
              borderRadius: 8,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.5rem 1.5rem",
              fontSize: "0.875rem",
            }}
          >
            <BookingInfoRow label="Booking Ref" value={booking.bookingRef} />
            <BookingInfoRow label="Customer" value={booking.customer.fullName} />
            <BookingInfoRow
              label="Vehicle"
              value={`${booking.vehicle.make} ${booking.vehicle.model} (${booking.vehicle.regNo})`}
            />
            <BookingInfoRow label="Status" value={booking.status} />
            <BookingInfoRow label="Final Amount" value={formatCurrency(finalAmount)} />
            <BookingInfoRow label="Total Paid" value={formatCurrency(totalPaid)} />
            <BookingInfoRow
              label="Balance Due"
              value={formatCurrency(balanceDue)}
              highlight={balanceDue > 0}
            />
          </div>
        )}
      </section>

      {/* Payment details */}
      <section
        style={{
          background: "var(--color-bg)",
          border: "1px solid var(--color-border)",
          borderRadius: 10,
          padding: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        <h2 style={{ margin: "0 0 1.25rem", fontSize: "1rem", fontWeight: 600 }}>
          2. Payment Details
        </h2>

        {/* Payment Type */}
        <div style={fieldGroup}>
          <label style={labelStyle}>Payment Type</label>
          <select
            value={paymentType}
            onChange={(e) => setPaymentType(e.target.value)}
            style={inputStyle}
          >
            <option value="RENTAL_FEE">Rental Fee</option>
            <option value="DEPOSIT">Security Deposit</option>
            <option value="EXTRA_CHARGE">Extra Charges</option>
          </select>
        </div>

        {/* Amount */}
        <div style={fieldGroup}>
          <label style={labelStyle}>Amount (LKR)</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Notes */}
        <div style={fieldGroup}>
          <label style={labelStyle}>Notes (optional)</label>
          <textarea
            rows={2}
            placeholder="Any remarks…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>
      </section>

      {/* Payment Method */}
      <section
        style={{
          background: "var(--color-bg)",
          border: "1px solid var(--color-border)",
          borderRadius: 10,
          padding: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        <h2 style={{ margin: "0 0 1.25rem", fontSize: "1rem", fontWeight: 600 }}>
          3. Payment Method
        </h2>

        <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
          {(["CASH", "CARD"] as PayMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setPayMode(mode)}
              style={{
                flex: 1,
                padding: "0.875rem",
                borderRadius: 8,
                border: `2px solid ${payMode === mode ? "var(--color-info)" : "var(--color-border)"}`,
                background: payMode === mode ? "var(--color-info-tint-12)" : "var(--color-bg)",
                color: payMode === mode ? "var(--color-info)" : "var(--color-text)",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "0.9375rem",
                transition: "all 0.15s",
              }}
            >
              {mode === "CASH" ? "💵 Cash" : "💳 Card (PayHere)"}
            </button>
          ))}
        </div>

        {payMode === "CASH" ? (
          <div
            style={{
              padding: "1rem",
              background: "var(--color-surface)",
              borderRadius: 8,
              fontSize: "0.875rem",
              color: "var(--color-subtle)",
            }}
          >
            The payment will be recorded immediately as <strong>COMPLETED</strong>.
          </div>
        ) : (
          <div
            style={{
              padding: "1rem",
              background: "var(--color-info-tint-12)",
              borderRadius: 8,
              fontSize: "0.875rem",
              color: "var(--color-info)",
            }}
          >
            You will be redirected to the <strong>PayHere sandbox</strong> checkout. After payment,
            PayHere notifies our server and the status is updated automatically.
          </div>
        )}
      </section>

      {/* Errors / success */}
      {error && (
        <div style={alertDanger}>{error}</div>
      )}
      {success && (
        <div style={alertSuccess}>{success}</div>
      )}

      {/* Submit */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
        <Link href="/payments" style={{ ...btnSecondary, textDecoration: "none" }}>
          Cancel
        </Link>
        <button
          onClick={payMode === "CASH" ? handleCashSubmit : handleCardSubmit}
          disabled={submitting || !booking}
          style={btnPrimary}
        >
          {submitting
            ? "Processing…"
            : payMode === "CASH"
            ? "Record Cash Payment"
            : "Pay with Card →"}
        </button>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function BookingInfoRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ color: "var(--color-subtle)", fontSize: "0.75rem" }}>{label}</span>
      <span
        style={{
          fontWeight: 500,
          color: highlight ? "var(--color-danger)" : "var(--color-text)",
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.625rem 0.75rem",
  border: "1px solid var(--color-border)",
  borderRadius: 6,
  fontSize: "0.9375rem",
  color: "var(--color-text)",
  background: "var(--color-bg)",
  boxSizing: "border-box",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  fontSize: "0.875rem",
  fontWeight: 500,
  color: "var(--color-text)",
  marginBottom: "0.375rem",
  display: "block",
};

const fieldGroup: React.CSSProperties = {
  marginBottom: "1rem",
};

const btnPrimary: React.CSSProperties = {
  padding: "0.625rem 1.25rem",
  background: "var(--color-info)",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  fontWeight: 600,
  cursor: "pointer",
  fontSize: "0.9375rem",
  whiteSpace: "nowrap",
};

const btnSecondary: React.CSSProperties = {
  padding: "0.625rem 1.25rem",
  background: "var(--color-surface)",
  color: "var(--color-text)",
  border: "1px solid var(--color-border)",
  borderRadius: 6,
  fontWeight: 500,
  cursor: "pointer",
  fontSize: "0.9375rem",
  display: "inline-block",
};

const alertDanger: React.CSSProperties = {
  padding: "0.75rem 1rem",
  background: "var(--color-danger-tint-6)",
  border: "1px solid var(--color-danger-tint-20)",
  borderRadius: 6,
  color: "var(--color-danger)",
  fontSize: "0.875rem",
  marginBottom: "1rem",
};

const alertSuccess: React.CSSProperties = {
  padding: "0.75rem 1rem",
  background: "var(--color-green-tint-10)",
  border: "1px solid var(--color-green)",
  borderRadius: 6,
  color: "var(--color-green)",
  fontSize: "0.875rem",
  marginBottom: "1rem",
};
