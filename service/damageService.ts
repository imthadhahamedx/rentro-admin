// services/damageService.ts
// Typed wrappers for /api/v1/damage/* endpoints.

import apiClient from "@/lib/axios";
import { StandardResponse } from "./authService";
import { PaginatedResponse } from "./bookingService";

// ─── Enums (mirror backend) ───────────────────────────────────────────────────
export type DamageBy = "CUSTOMER" | "INTERNAL" | "OTHER";

/** Client-side filter value for the fixed/open toggle. Maps to isFixed on the backend. */
export type DamageStatusFilter = "" | "OPEN" | "FIXED";

// ─── Types that mirror the backend DTOs ──────────────────────────────────────
export interface DamageImage {
  id: string;
  fileName: string;
  url: string;
  createdAt: string;
}

export interface DamageListItem {
  id: string;
  vehicleId: string;
  vehicleLabel: string;
  vehicleRegNo: string;
  description: string;
  isFixed: boolean;
  damageBy: DamageBy;
  createdAt: string;
  markedByName: string | null;
  primaryImageUrl: string | null;
  imageCount: number;
}

export interface DamageDetail {
  id: string;
  description: string;
  isFixed: boolean;
  damageBy: DamageBy;
  createdAt: string;
  fixedAt: string | null;
  remark: string | null;
  vehicleId: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleRegNo: string;
  vehicleLabel: string;
  markedById: string | null;
  markedByName: string | null;
  images: DamageImage[];
}

export interface DamagePayload {
  vehicleId: string;
  description: string;
  damageBy: DamageBy;
  remark?: string;
}

export interface DamageFixedStatusPayload {
  isFixed: boolean;
  remark?: string;
}

/** Lightweight vehicle reference used to populate the vehicle select on damage forms. */
export interface VehicleOption {
  id: string;
  make: string;
  model: string;
  modelYear: number;
  regNo: string;
  categoryName: string;
  status: string;
}

// ─── Damage: list / detail ─────────────────────────────────────────────────────
export async function getDamages(params: {
  searchText?: string;
  status?: DamageStatusFilter;
  damageBy?: DamageBy | "";
  vehicleId?: string;
  page?: number;
  size?: number;
}): Promise<PaginatedResponse<DamageListItem>> {
  const response = await apiClient.get<StandardResponse<PaginatedResponse<DamageListItem>>>(
    "/damage/admin",
    {
      params: {
        searchText: params.searchText ?? "",
        status: params.status || undefined,
        damageBy: params.damageBy || undefined,
        vehicleId: params.vehicleId || undefined,
        page: params.page ?? 0,
        size: params.size ?? 10,
      },
    }
  );
  return response.data.data;
}

export async function getDamageById(id: string): Promise<DamageDetail> {
  const response = await apiClient.get<StandardResponse<DamageDetail>>(`/damage/${id}`);
  return response.data.data;
}

// ─── Damage: create / update ───────────────────────────────────────────────────
function buildDamageFormData(payload: DamagePayload, images?: File[]): FormData {
  const formData = new FormData();
  const damageBlob = new Blob([JSON.stringify(payload)], { type: "application/json" });
  formData.append("damage", damageBlob);
  (images ?? []).forEach((file) => formData.append("images", file));
  return formData;
}

export async function createDamage(payload: DamagePayload, images?: File[]): Promise<DamageDetail> {
  const formData = buildDamageFormData(payload, images);
  const response = await apiClient.post<StandardResponse<DamageDetail>>("/damage", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.data;
}

export async function updateDamage(
  id: string,
  payload: DamagePayload,
  newImages?: File[]
): Promise<DamageDetail> {
  const formData = buildDamageFormData(payload, newImages);
  const response = await apiClient.put<StandardResponse<DamageDetail>>(`/damage/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.data;
}

export async function updateDamageFixedStatus(id: string, payload: DamageFixedStatusPayload): Promise<void> {
  await apiClient.patch(`/damage/${id}/status`, payload);
}

export async function deleteDamage(id: string): Promise<void> {
  await apiClient.delete(`/damage/${id}`);
}

// ─── Damage images ──────────────────────────────────────────────────────────────
export async function addDamageImages(id: string, images: File[]): Promise<DamageDetail> {
  const formData = new FormData();
  images.forEach((file) => formData.append("images", file));
  const response = await apiClient.post<StandardResponse<DamageDetail>>(
    `/damage/${id}/images`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return response.data.data;
}

export async function deleteDamageImage(id: string, imageId: string): Promise<void> {
  await apiClient.delete(`/damage/${id}/images/${imageId}`);
}

// ─── Vehicle options (for the vehicle select on damage forms) ────────────────
/** Pulls a large page of vehicles in one go, for use in a <select>. */
export async function getAllVehicleOptionsForDamage(): Promise<VehicleOption[]> {
  const response = await apiClient.get<StandardResponse<PaginatedResponse<VehicleOption>>>(
    "/vehicles/admin",
    { params: { searchText: "", page: 0, size: 200 } }
  );
  return response.data.data.dataList;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
/** Extracts a human-readable message from an Axios/StandardResponse error. */
export function getErrorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  const anyErr = err as { response?: { data?: { message?: string } } };
  return anyErr?.response?.data?.message ?? fallback;
}
