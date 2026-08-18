// services/customerService.ts
// Typed wrappers for /api/v1/customers/* endpoints.

import apiClient from "@/lib/axios";
import { StandardResponse } from "./authService";
import { PaginatedResponse, BookingListItem } from "./bookingService";

// ─── Types that mirror the backend DTOs ──────────────────────────────────────
export interface CustomerAddress {
  id?: string;
  address: string;
  city: string;
  country: string;
}

export interface CustomerListItem {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  nic: string;
  drivingLicenseNo: string;
  licenseExpiryDate: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CustomerDetail {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  nic: string;
  drivingLicenseNo: string;
  licenseExpiryDate: string | null;
  dateOfBirth: string | null;
  notes: string | null;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  addresses: CustomerAddress[];
  totalBookings: number;
}

export interface CustomerCreatePayload {
  fullName: string;
  email: string;
  password: string;
  phoneNumber: string;
  nic: string;
  drivingLicenseNo: string;
  licenseExpiryDate: string;
  dateOfBirth?: string;
  notes?: string;
  address?: Partial<CustomerAddress>;
}

export interface CustomerUpdatePayload {
  fullName: string;
  email: string;
  phoneNumber: string;
  nic: string;
  drivingLicenseNo: string;
  licenseExpiryDate: string;
  dateOfBirth?: string;
  notes?: string;
  password?: string;
  address?: Partial<CustomerAddress>;
}

// ─── List / detail ────────────────────────────────────────────────────────────
export async function getCustomers(params: {
  searchText?: string;
  isActive?: boolean;
  page?: number;
  size?: number;
}): Promise<PaginatedResponse<CustomerListItem>> {
  const response = await apiClient.get<StandardResponse<PaginatedResponse<CustomerListItem>>>(
    "/customers",
    {
      params: {
        searchText: params.searchText ?? "",
        isActive: params.isActive,
        page: params.page ?? 0,
        size: params.size ?? 10,
      },
    }
  );
  return response.data.data;
}

export async function getCustomerById(id: string): Promise<CustomerDetail> {
  const response = await apiClient.get<StandardResponse<CustomerDetail>>(`/customers/${id}`);
  return response.data.data;
}

// ─── Create / update ──────────────────────────────────────────────────────────
export async function createCustomer(payload: CustomerCreatePayload): Promise<CustomerDetail> {
  const response = await apiClient.post<StandardResponse<CustomerDetail>>("/customers", payload);
  return response.data.data;
}

export async function updateCustomer(id: string, payload: CustomerUpdatePayload): Promise<CustomerDetail> {
  const response = await apiClient.put<StandardResponse<CustomerDetail>>(`/customers/${id}`, payload);
  return response.data.data;
}

export async function updateCustomerStatus(id: string, isActive: boolean): Promise<void> {
  await apiClient.patch(`/customers/${id}/status`, { isActive });
}

export async function deleteCustomer(id: string): Promise<void> {
  await apiClient.delete(`/customers/${id}`);
}

// ─── Booking history ────────────────────────────────────────────────────────
export async function getCustomerBookings(
  id: string,
  params: { status?: string; page?: number; size?: number }
): Promise<PaginatedResponse<BookingListItem>> {
  const response = await apiClient.get<StandardResponse<PaginatedResponse<BookingListItem>>>(
    `/customers/${id}/bookings`,
    {
      params: {
        status: params.status || undefined,
        page: params.page ?? 0,
        size: params.size ?? 10,
      },
    }
  );
  return response.data.data;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
/** Extracts a human-readable message from an Axios/StandardResponse error. */
export function getErrorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  const anyErr = err as { response?: { data?: { message?: string } } };
  return anyErr?.response?.data?.message ?? fallback;
}
