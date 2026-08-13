// services/authService.ts
// Typed wrappers for /api/v1/auth/* endpoints.

import apiClient from "@/lib/axios";

// ─── Types that mirror the backend DTOs ──────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  email: string;
  fullName: string;
  role: "CUSTOMER" | "STAFF" | "ADMIN" | "SUPER_ADMIN";
}

export interface StandardResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

// ─── Host-allowed roles ───────────────────────────────────────────────────────
const HOST_ROLES: AuthResponse["role"][] = ["STAFF", "ADMIN", "SUPER_ADMIN"];

export function isHostRole(role: string): boolean {
  return HOST_ROLES.includes(role as AuthResponse["role"]);
}

// ─── API calls ────────────────────────────────────────────────────────────────

/**
 * POST /auth/login
 * Returns the AuthResponse payload on success.
 * Throws an Error with a human-readable message on failure.
 */
export async function loginUser(credentials: LoginRequest): Promise<AuthResponse> {
  const response = await apiClient.post<StandardResponse<AuthResponse>>(
    "/auth/login",
    credentials
  );
  return response.data.data;
}
