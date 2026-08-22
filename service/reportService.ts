// services/reportService.ts
// Typed wrappers for /api/v1/reports/* endpoints.

import apiClient from "@/lib/axios";
import { StandardResponse } from "./authService";

// ─── Shared shapes (mirror backend report DTOs) ──────────────────────────────
export interface LabeledCount {
  label: string;
  count: number;
}

export interface LabeledAmount {
  label: string;
  amount: number;
  count: number;
}

export interface MonthlyPoint {
  month: string; // e.g. "Jan 2026"
  count: number;
  amount: number;
}

export interface TopVehicleRevenue {
  vehicleId: string;
  vehicleName: string;
  regNo: string;
  bookingsCount: number;
  revenue: number;
}

export interface TopCustomer {
  customerId: string;
  customerName: string;
  bookingsCount: number;
  totalSpent: number;
}

export interface VehicleUtilization {
  vehicleId: string;
  vehicleName: string;
  regNo: string;
  categoryName: string;
  status: string;
  bookingsCount: number;
  daysBooked: number;
  revenue: number;
  utilizationRate: number; // 0-100
}

export interface VehicleDamageCount {
  vehicleId: string;
  vehicleName: string;
  regNo: string;
  damageCount: number;
  unfixedCount: number;
}

// ─── Report response shapes ───────────────────────────────────────────────────
export interface RevenueReport {
  startDate: string;
  endDate: string;
  totalRevenue: number;
  totalPayments: number;
  averagePaymentAmount: number;
  monthlyRevenue: MonthlyPoint[];
  byPaymentMethod: LabeledAmount[];
  byPaymentType: LabeledAmount[];
  topVehicles: TopVehicleRevenue[];
}

export interface BookingsReport {
  startDate: string;
  endDate: string;
  totalBookings: number;
  totalRevenue: number;
  averageBookingValue: number;
  averageDurationDays: number;
  byStatus: LabeledCount[];
  monthlyBookings: MonthlyPoint[];
  byPickupLocation: LabeledCount[];
  topCustomers: TopCustomer[];
}

export interface VehiclesReport {
  startDate: string;
  endDate: string;
  totalVehicles: number;
  byStatus: LabeledCount[];
  byCategory: LabeledCount[];
  utilization: VehicleUtilization[];
}

export interface DamageReportSummary {
  startDate: string;
  endDate: string;
  totalDamages: number;
  fixedCount: number;
  unfixedCount: number;
  byDamageBy: LabeledCount[];
  monthlyDamages: MonthlyPoint[];
  topDamagedVehicles: VehicleDamageCount[];
}

// ─── Query params ─────────────────────────────────────────────────────────────
export interface ReportDateRangeParams {
  startDate?: string; // yyyy-MM-dd
  endDate?: string; // yyyy-MM-dd
}

function buildParams(params: ReportDateRangeParams) {
  return {
    startDate: params.startDate || undefined,
    endDate: params.endDate || undefined,
  };
}

// ─── API calls ────────────────────────────────────────────────────────────────
/** GET /reports/revenue */
export async function getRevenueReport(params: ReportDateRangeParams = {}): Promise<RevenueReport> {
  const response = await apiClient.get<StandardResponse<RevenueReport>>("/reports/revenue", {
    params: buildParams(params),
  });
  return response.data.data;
}

/** GET /reports/bookings */
export async function getBookingsReport(params: ReportDateRangeParams = {}): Promise<BookingsReport> {
  const response = await apiClient.get<StandardResponse<BookingsReport>>("/reports/bookings", {
    params: buildParams(params),
  });
  return response.data.data;
}

/** GET /reports/vehicles */
export async function getVehiclesReport(params: ReportDateRangeParams = {}): Promise<VehiclesReport> {
  const response = await apiClient.get<StandardResponse<VehiclesReport>>("/reports/vehicles", {
    params: buildParams(params),
  });
  return response.data.data;
}

/** GET /reports/damage */
export async function getDamageReport(params: ReportDateRangeParams = {}): Promise<DamageReportSummary> {
  const response = await apiClient.get<StandardResponse<DamageReportSummary>>("/reports/damage", {
    params: buildParams(params),
  });
  return response.data.data;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
/** Extracts a human-readable message from an Axios/StandardResponse error. */
export function getErrorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  const anyErr = err as { response?: { data?: { message?: string } } };
  return anyErr?.response?.data?.message ?? fallback;
}
