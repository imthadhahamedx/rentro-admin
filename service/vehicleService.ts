// services/vehicleService.ts
// Typed wrappers for /api/v1/vehicles/* and /api/v1/vehicle-categories/* endpoints.
import apiClient from "@/lib/axios";
import { StandardResponse } from "./authService";
import { PaginatedResponse } from "./bookingService";

// ─── Enums (mirror backend) ───────────────────────────────────────────────────
export type VehicleStatus = "AVAILABLE" | "RENTED" | "MAINTENANCE" | "INACTIVE";
export type Transmission = "MANUAL" | "AUTOMATIC" | "TIPTRONIC";
export type FuelType = "PETROL" | "DIESEL" | "HYBRID" | "ELECTRIC";

// ─── Types that mirror the backend DTOs ──────────────────────────────────────
export interface VehicleImage {
  id: string;
  fileName: string;
  url: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface VehicleListItem {
  id: string;
  make: string;
  model: string;
  modelYear: number;
  regNo: string;
  colour: string;
  transmission: Transmission;
  fuelType: FuelType;
  dailyRate: number;
  status: VehicleStatus;
  categoryName: string;
  primaryImageUrl: string | null;
}

export interface VehicleDetail {
  id: string;
  make: string;
  model: string;
  modelYear: number;
  regNo: string;
  colour: string;
  transmission: Transmission;
  fuelType: FuelType;
  seatCount: number;
  doorCount: number;
  dailyRate: number;
  status: VehicleStatus;
  currentMileageKm: number | null;
  createdAt: string;
  updatedAt: string;
  categoryId: string;
  categoryName: string;
  specifications: string[];
  images: VehicleImage[];
}

export interface VehicleCategory {
  id: string;
  category: string;
  description: string;
  iconName: string;
  createdAt: string;
  vehicleCount: number;
}

export interface VehiclePayload {
  make: string;
  model: string;
  modelYear: number;
  regNo: string;
  colour?: string;
  transmission: Transmission;
  fuelType: FuelType;
  seatCount: number;
  doorCount: number;
  dailyRate: number;
  status?: VehicleStatus;
  currentMileageKm?: number;
  categoryId: string;
  specIds?: string[];
}

export interface VehicleCategoryPayload {
  category: string;
  description: string;
  iconName: string;
}

// ─── Vehicles: list / detail ──────────────────────────────────────────────────
export async function getVehicles(params: {
  searchText?: string;
  categoryId?: string;
  status?: string;
  page?: number;
  size?: number;
}): Promise<PaginatedResponse<VehicleListItem>> {
  const response = await apiClient.get<StandardResponse<PaginatedResponse<VehicleListItem>>>(
    "/vehicles/admin",
    {
      params: {
        searchText: params.searchText ?? "",
        categoryId: params.categoryId || undefined,
        status: params.status || undefined,
        page: params.page ?? 0,
        size: params.size ?? 10,
      },
    }
  );
  return response.data.data;
}

export async function getVehicleById(id: string): Promise<VehicleDetail> {
  const response = await apiClient.get<StandardResponse<VehicleDetail>>(`/vehicles/${id}`);
  return response.data.data;
}

// ─── Vehicles: create / update ────────────────────────────────────────────────
function buildVehicleFormData(payload: VehiclePayload, images?: File[]): FormData {
  const formData = new FormData();
  const vehicleBlob = new Blob([JSON.stringify(payload)], { type: "application/json" });
  formData.append("vehicle", vehicleBlob);
  (images ?? []).forEach((file) => formData.append("images", file));
  return formData;
}

export async function createVehicle(payload: VehiclePayload, images?: File[]): Promise<VehicleDetail> {
  const formData = buildVehicleFormData(payload, images);
  const response = await apiClient.post<StandardResponse<VehicleDetail>>("/vehicles", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.data;
}

export async function updateVehicle(
  id: string,
  payload: VehiclePayload,
  newImages?: File[]
): Promise<VehicleDetail> {
  const formData = buildVehicleFormData(payload, newImages);
  const response = await apiClient.put<StandardResponse<VehicleDetail>>(`/vehicles/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.data;
}

export async function updateVehicleStatus(id: string, status: VehicleStatus): Promise<void> {
  await apiClient.patch(`/vehicles/${id}/status`, { status });
}

export async function deleteVehicle(id: string): Promise<void> {
  await apiClient.delete(`/vehicles/${id}`);
}

// ─── Vehicle images ────────────────────────────────────────────────────────────
export async function addVehicleImages(id: string, images: File[]): Promise<VehicleDetail> {
  const formData = new FormData();
  images.forEach((file) => formData.append("images", file));
  const response = await apiClient.post<StandardResponse<VehicleDetail>>(
    `/vehicles/${id}/images`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return response.data.data;
}

export async function deleteVehicleImage(id: string, imageId: string): Promise<void> {
  await apiClient.delete(`/vehicles/${id}/images/${imageId}`);
}

export async function setPrimaryVehicleImage(id: string, imageId: string): Promise<void> {
  await apiClient.patch(`/vehicles/${id}/images/${imageId}/primary`);
}

// ─── Vehicle categories ────────────────────────────────────────────────────────
export async function getVehicleCategories(params: {
  searchText?: string;
  page?: number;
  size?: number;
}): Promise<PaginatedResponse<VehicleCategory>> {
  const response = await apiClient.get<StandardResponse<PaginatedResponse<VehicleCategory>>>(
    "/vehicle-categories/admin",
    {
      params: {
        searchText: params.searchText ?? "",
        page: params.page ?? 0,
        size: params.size ?? 10,
      },
    }
  );
  return response.data.data;
}

/** Lightweight helper used by selects — pulls a large page of categories in one go. */
export async function getAllVehicleCategoryOptions(): Promise<VehicleCategory[]> {
  const result = await getVehicleCategories({ page: 0, size: 200 });
  return result.dataList;
}

export async function createVehicleCategory(payload: VehicleCategoryPayload): Promise<void> {
  await apiClient.post("/vehicle-categories", payload);
}

export async function updateVehicleCategory(id: string, payload: VehicleCategoryPayload): Promise<void> {
  await apiClient.put(`/vehicle-categories/${id}`, payload);
}

export async function deleteVehicleCategory(id: string): Promise<void> {
  await apiClient.delete(`/vehicle-categories/${id}`);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
/** Extracts a human-readable message from an Axios/StandardResponse error. */
export function getErrorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  const anyErr = err as { response?: { data?: { message?: string } } };
  return anyErr?.response?.data?.message ?? fallback;
}
