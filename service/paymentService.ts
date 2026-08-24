// services/paymentService.ts
// Typed wrappers for /api/v1/payments/* endpoints.

import apiClient from "@/lib/axios";
import { StandardResponse } from "./authService";

export interface PaginatedResponse<T> {
  count: number;
  dataList: T[];
}

// ─── Types ────────────────────────────────────────────────────────────────────
export type PaymentMethod = "CASH" | "CREDIT_CARD" | "DEBIT_CARD" | "BANK_TRANSFER" | "ONLINE";
export type PaymentType   = "DEPOSIT" | "RENTAL_FEE" | "EXTRA_CHARGE" | "REFUND";
export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";

export interface PaymentListItem {
  id: string;
  paymentRef: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentType: PaymentType;
  status: PaymentStatus;
  transactionId: string | null;
  notes: string | null;
  paidAt: string | null;
  createdAt: string;

  bookingId: string;
  bookingRef: string;
  customerName: string;
  vehicleName: string;
  processedByName: string | null;
}

export interface PaymentDetail extends PaymentListItem {
  gatewayResponse: string | null;
  customerPhoneNumber: string | null;
  vehicleRegNo: string | null;
  bookingFinalAmount: number;
  bookingTotalPaid: number;
  bookingBalanceDue: number;
}

export interface PaymentCreatePayload {
  bookingId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentType: PaymentType;
  transactionId?: string;
  notes?: string;
}

export interface PayhereHashResponse {
  merchantId: string;
  hash: string;
}

export interface PaymentRefundPayload {
  reason: string;
}

// ─── API calls ────────────────────────────────────────────────────────────────
/** Get all payments for a booking */
export async function getPaymentsByBookingId(bookingId: string): Promise<PaymentListItem[]> {
  const res = await apiClient.get<StandardResponse<PaymentListItem[]>>(
    `/payments/booking/${bookingId}`
  );
  return res.data.data;
}

/** Get all payments (paginated) */
export async function getPayments(params?: {
  searchText?: string;
  status?: string;
  page?: number;
  size?: number;
}): Promise<PaymentListItem[]> {
  const res = await apiClient.get<StandardResponse<PaginatedResponse<PaymentListItem>>>("/payments", {
    params: {
      searchText: params?.searchText ?? "",
      status: params?.status,
      page: params?.page ?? 0,
      size: params?.size ?? 20,
    },
  });
  return res.data.data.dataList;
}

/** Get single payment */
export async function getPaymentById(id: string): Promise<PaymentDetail> {
  const res = await apiClient.get<StandardResponse<PaymentDetail>>(`/payments/${id}`);
  return res.data.data;
}

/** Record a cash payment – returns new payment UUID */
export async function recordCashPayment(payload: PaymentCreatePayload): Promise<string> {
  const res = await apiClient.post<StandardResponse<string>>("/payments/cash", payload);
  return res.data.data;
}

/**
 * Step 1 of online flow: create PENDING payment record.
 * Returns the payment UUID to use as PayHere order_id.
 */
export async function initOnlinePayment(payload: PaymentCreatePayload): Promise<string> {
  const res = await apiClient.post<StandardResponse<string>>("/payments/online/init", payload);
  return res.data.data;
}

/**
 * Step 2 of online flow: get hash from backend to pass to PayHere JS SDK.
 */
export async function getPayhereHash(
  orderId: string,
  amount: number,
  currency = "LKR"
): Promise<PayhereHashResponse> {
  const res = await apiClient.post<StandardResponse<PayhereHashResponse>>("/payments/online/hash", {
    orderId,
    amount,
    currency,
  });
  return res.data.data;
}

/** Refund a completed payment */
export async function refundPayment(id: string, payload: PaymentRefundPayload): Promise<void> {
  await apiClient.post(`/payments/${id}/refund`, payload);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function getErrorMessage(
  err: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  const anyErr = err as { response?: { data?: { message?: string } } };
  return anyErr?.response?.data?.message ?? fallback;
}

export function formatCurrency(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-LK", { maximumFractionDigits: 2 })}`;
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Cash",
  CREDIT_CARD: "Credit Card (Online)",
  DEBIT_CARD: "Debit Card (Online)",
  BANK_TRANSFER: "Bank Transfer",
  ONLINE: "Online (PayHere)",
};

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  DEPOSIT: "Security Deposit",
  RENTAL_FEE: "Rental Fee",
  EXTRA_CHARGE: "Extra Charges",
  REFUND: "Refund",
};
