// services/damageReportService.ts
// Typed wrappers for /api/v1/damage-reports/* endpoints.

import apiClient from "@/lib/axios";
import { StandardResponse } from "./authService";
import { PaginatedResponse } from "./bookingService";
import { DamageImage } from "./damageService";

// ─── Types ───────────────────────────────────────────────────────────────────
export type DamageReportReviewedFilter = "" | "PENDING" | "REVIEWED";

export interface BookingOption {
  id: string;
  bookingRef: string;
  customerName: string | null;
  vehicleLabel: string;
  status: string;
}

export interface DamageReportListItem {
  id: string;
  date: string;

  bookingId: string;
  bookingRef: string;
  customerName: string | null;

  damageId: string;
  vehicleLabel: string;
  vehicleRegNo: string;
  damageDescription: string;
  damageIsFixed: boolean;
  damageBy: string;
  primaryImageUrl: string | null;

  reviewedById: string | null;
  reviewedByName: string | null;
  reviewed: boolean;
}

export interface DamageReportDetail {
  id: string;
  date: string;

  bookingId: string;
  bookingRef: string;
  bookingStatus: string;
  customerId: string;
  customerName: string | null;
  customerPhone: string | null;
  pickupDate: string;
  dropoffDate: string;

  damageId: string;
  damageDescription: string;
  damageIsFixed: boolean;
  damageBy: string;
  damageCreatedAt: string;
  damageFixedAt: string | null;
  damageRemark: string | null;
  damageImages: DamageImage[];

  vehicleId: string;
  vehicleLabel: string;
  vehicleRegNo: string;

  reviewedById: string | null;
  reviewedByName: string | null;
  reviewed: boolean;
}

export interface DamageReportPayload {
  bookingId: string;
  damageId: string;
}

// ─── API calls ───────────────────────────────────────────────────────────────
export async function searchBookingsForDamageReport(
  searchText: string
): Promise<BookingOption[]> {
  const response = await apiClient.get<
    StandardResponse<PaginatedResponse<BookingOption>>
  >("/booking", {
    params: {
      searchText: searchText ?? "",
      page: 0,
      size: 20,
    },
  });
  return response.data.data.dataList;
}

export async function getDamageReports(params: {
  searchText?: string;
  reviewed?: DamageReportReviewedFilter;
  page?: number;
  size?: number;
}): Promise<PaginatedResponse<DamageReportListItem>> {
  const response = await apiClient.get<
    StandardResponse<PaginatedResponse<DamageReportListItem>>
  >("/damage-reports/admin", {
    params: {
      searchText: params.searchText ?? "",
      reviewed: params.reviewed || undefined,
      page: params.page ?? 0,
      size: params.size ?? 10,
    },
  });
  return response.data.data;
}

export async function getDamageReportById(
  id: string
): Promise<DamageReportDetail> {
  const response = await apiClient.get<StandardResponse<DamageReportDetail>>(
    `/damage-reports/${id}`
  );
  return response.data.data;
}

export async function createDamageReport(
  payload: DamageReportPayload
): Promise<DamageReportDetail> {
  const response = await apiClient.post<StandardResponse<DamageReportDetail>>(
    "/damage-reports",
    payload
  );
  return response.data.data;
}

export async function markDamageReportReviewed(id: string): Promise<void> {
  await apiClient.post(`/damage-reports/${id}/review`);
}

export async function deleteDamageReport(id: string): Promise<void> {
  await apiClient.delete(`/damage-reports/${id}`);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function getErrorMessage(
  err: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  const anyErr = err as { response?: { data?: { message?: string } } };
  return anyErr?.response?.data?.message ?? fallback;
}