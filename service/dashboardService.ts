// services/dashboardService.ts
// Typed wrapper for /api/v1/dashboard/* endpoints.

import apiClient from "@/lib/axios";
import { StandardResponse } from "./authService";

// ─── Types that mirror the backend DTOs ──────────────────────────────────────

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "ACTIVE"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export interface DashboardStats {
  totalBookings: number;
  bookingsThisMonth: number;
  activeBookings: number;

  totalRevenue: number;
  revenueThisMonth: number;

  totalVehicles: number;
  availableVehicles: number;

  totalCustomers: number;
  newCustomersThisMonth: number;

  pendingPaymentsCount: number;
  pendingPaymentsAmount: number;

  openDamageReports: number;
}

export interface RecentBooking {
  id: string;
  bookingRef: string;
  customerName: string;
  vehicleName: string;
  status: BookingStatus;
  pickupDate: string;
  dropoffDate: string;
  totalAmount: number;
  createdAt: string;
}

export interface RentedVehicle {
  vehicleId: string;
  vehicleName: string;
  regNo: string;
  bookingRef: string;
  customerName: string;
  dropoffDate: string;
}

export interface VehicleStatus {
  total: number;
  available: number;
  rented: number;
  maintenance: number;
  inactive: number;
  rentedVehicles: RentedVehicle[];
}

export interface DashboardOverview {
  stats: DashboardStats;
  recentBookings: RecentBooking[];
  vehicleStatus: VehicleStatus;
}

// ─── API calls ────────────────────────────────────────────────────────────────

/**
 * GET /dashboard/overview
 * Returns stats, recent bookings, and vehicle status for the Overview page.
 * Requires STAFF / ADMIN / SUPER_ADMIN role (enforced server-side).
 */
export async function getDashboardOverview(): Promise<DashboardOverview> {
  const response = await apiClient.get<StandardResponse<DashboardOverview>>(
    "/dashboard/overview"
  );
  return response.data.data;
}
