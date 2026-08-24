// services/bookingService.ts
// Typed wrappers for /api/v1/bookings/* endpoints.

import apiClient from "@/lib/axios";
import { StandardResponse } from "./authService";
import { BookingStatus } from "./dashboardService";

// ─── Types that mirror the backend DTOs ──────────────────────────────────────
export interface PaginatedResponse<T> {
  count: number;
  dataList: T[];
}

export interface BookingListItem {
  id: string;
  bookingRef: string;
  status: BookingStatus;
  customerName: string;
  customerPhone: string;
  vehicleName: string;
  regNo: string;
  pickupLocationName: string;
  dropoffLocationName: string;
  pickupDate: string;
  dropoffDate: string;
  totalAmount: number;
  finalAmount: number;
  createdAt: string;
}

export interface BookingCustomerSummary {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  nic: string;
  drivingLicenseNo: string;
  licenseExpiryDate: string | null;
}

export interface BookingVehicleSummary {
  id: string;
  make: string;
  model: string;
  modelYear: number;
  regNo: string;
  colour: string;
  categoryName: string;
  dailyRate: number;
  status: string;
}

export interface BookingLocationSummary {
  id: string;
  locationName: string;
  city: string;
}

export interface BookingExtensionResponse {
  id: string;
  originalDropoffDate: string;
  newDropoffDate: string;
  additionalDays: number;
  additionalAmount: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reason: string | null;
  createdAt: string;
  approvedAt: string | null;
  approvedByName: string | null;
}

export interface BookingDetail {
  id: string;
  bookingRef: string;
  status: BookingStatus;

  pickupDate: string;
  dropoffDate: string;
  actualReturnDate: string | null;
  totalDays: number;

  dailyRate: number;
  totalAmount: number;
  discountAmount: number;
  extraCharges: number;
  extraChargesNote: string | null;
  finalAmount: number;

  totalPaid: number;
  balanceDue: number;

  notes: string | null;

  createdAt: string;
  updatedAt: string;

  createdByName: string | null;
  approvedByName: string | null;

  customer: BookingCustomerSummary;
  vehicle: BookingVehicleSummary;
  pickupLocation: BookingLocationSummary;
  dropoffLocation: BookingLocationSummary;

  extension: BookingExtensionResponse | null;

  damageReportsCount: number;
  paymentsCount: number;
}

export interface CustomerOption {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  nic: string;
  drivingLicenseNo: string;
}

export interface VehicleOption {
  id: string;
  make: string;
  model: string;
  modelYear: number;
  regNo: string;
  categoryName: string;
  dailyRate: number;
  status: string;
}

export interface LocationOption {
  id: string;
  locationName: string;
  city: string;
}

export interface BookingCreatePayload {
  customerId: string;
  vehicleId: string;
  pickupLocationId: string;
  dropoffLocationId: string;
  pickupDate: string;
  dropoffDate: string;
  discountAmount?: number;
  notes?: string;
}

export interface BookingCompletePayload {
  actualReturnDate: string;
  extraCharges?: number;
  extraChargesNote?: string;
  currentMileageKm?: number;
}

export interface BookingCancelPayload {
  reason: string;
}

export interface BookingExtensionPayload {
  newDropoffDate: string;
  reason?: string;
}

export interface BookingNotesPayload {
  notes: string;
}

// ─── List / detail ────────────────────────────────────────────────────────────
export async function getBookings(params: {
  searchText?: string;
  status?: string;
  page?: number;
  size?: number;
}): Promise<PaginatedResponse<BookingListItem>> {
  const response = await apiClient.get<StandardResponse<PaginatedResponse<BookingListItem>>>(
    "/booking",
    {
      params: {
        searchText: params.searchText ?? "",
        status: params.status ?? undefined,
        page: params.page ?? 0,
        size: params.size ?? 10,
      },
    }
  );
  return response.data.data;
}

export async function getBookingById(id: string): Promise<BookingDetail> {
  const response = await apiClient.get<StandardResponse<BookingDetail>>(`/booking/${id}`);
  return response.data.data;
}

export async function getBookingByRef(ref: string): Promise<BookingDetail> {
  const response = await apiClient.get<StandardResponse<BookingDetail>>(`/booking/payment/${ref}`);
  return response.data.data;
}

// ─── Option lookups (for the New Booking form) ───────────────────────────────
export async function getCustomerOptions(searchText = ""): Promise<CustomerOption[]> {
  const response = await apiClient.get<StandardResponse<CustomerOption[]>>(
    "/booking/options/customers",
    { params: { searchText } }
  );
  return response.data.data;
}

export async function getAvailableVehicleOptions(searchText = ""): Promise<VehicleOption[]> {
  const response = await apiClient.get<StandardResponse<VehicleOption[]>>(
    "/booking/options/vehicles",
    { params: { searchText } }
  );
  return response.data.data;
}

export async function getLocationOptions(): Promise<LocationOption[]> {
  const response = await apiClient.get<StandardResponse<LocationOption[]>>(
    "/booking/options/locations"
  );
  return response.data.data;
}

// ─── Create ───────────────────────────────────────────────────────────────────
export async function createBooking(payload: BookingCreatePayload): Promise<string> {
  const response = await apiClient.post<StandardResponse<string>>("/booking", payload);
  return response.data.data;
}

// ─── Lifecycle actions ────────────────────────────────────────────────────────
export async function confirmBooking(id: string): Promise<void> {
  await apiClient.put(`/booking/${id}/confirm`);
}

export async function activateBooking(id: string): Promise<void> {
  await apiClient.put(`/booking/${id}/activate`);
}

export async function completeBooking(id: string, payload: BookingCompletePayload): Promise<void> {
  await apiClient.put(`/booking/${id}/complete`, payload);
}

export async function cancelBooking(id: string, payload: BookingCancelPayload): Promise<void> {
  await apiClient.put(`/booking/${id}/cancel`, payload);
}

export async function extendBooking(id: string, payload: BookingExtensionPayload): Promise<void> {
  await apiClient.post(`/booking/${id}/extension`, payload);
}

export async function updateBookingNotes(id: string, payload: BookingNotesPayload): Promise<void> {
  await apiClient.put(`/booking/${id}/notes`, payload);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
/** Extracts a human-readable message from an Axios/StandardResponse error. */
export function getErrorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  const anyErr = err as { response?: { data?: { message?: string } } };
  return anyErr?.response?.data?.message ?? fallback;
}
