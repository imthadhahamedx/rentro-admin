// services/locationService.ts
// Typed wrappers for /api/v1/locations/* endpoints.

import apiClient from "@/lib/axios";
import { StandardResponse } from "./authService";
import { PaginatedResponse } from "./bookingService";

// ─── Types that mirror the backend DTOs ──────────────────────────────────────
export interface LocationItem {
  id: string;
  locationName: string;
  address: string | null;
  city: string;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  createdAt: string;
  pickupBookingCount: number;
  dropoffBookingCount: number;
  totalBookingCount: number;
}

export interface LocationPayload {
  locationName: string;
  address?: string;
  city: string;
  latitude?: number;
  longitude?: number;
  isActive?: boolean;
}

// ─── List / detail ────────────────────────────────────────────────────────────
export async function getLocations(params: {
  searchText?: string;
  isActive?: boolean;
  page?: number;
  size?: number;
}): Promise<PaginatedResponse<LocationItem>> {
  const response = await apiClient.get<StandardResponse<PaginatedResponse<LocationItem>>>(
    "/locations/admin",
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

export async function getLocationById(id: string): Promise<LocationItem> {
  const response = await apiClient.get<StandardResponse<LocationItem>>(`/locations/${id}`);
  return response.data.data;
}

// ─── Create / update ──────────────────────────────────────────────────────────
export async function createLocation(payload: LocationPayload): Promise<LocationItem> {
  const response = await apiClient.post<StandardResponse<LocationItem>>("/locations", payload);
  return response.data.data;
}

export async function updateLocation(id: string, payload: LocationPayload): Promise<LocationItem> {
  const response = await apiClient.put<StandardResponse<LocationItem>>(`/locations/${id}`, payload);
  return response.data.data;
}

export async function updateLocationStatus(id: string, isActive: boolean): Promise<void> {
  await apiClient.patch(`/locations/${id}/status`, { isActive });
}

export async function deleteLocation(id: string): Promise<void> {
  await apiClient.delete(`/locations/${id}`);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
/** Extracts a human-readable message from an Axios/StandardResponse error. */
export function getErrorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  const anyErr = err as { response?: { data?: { message?: string } } };
  return anyErr?.response?.data?.message ?? fallback;
}
