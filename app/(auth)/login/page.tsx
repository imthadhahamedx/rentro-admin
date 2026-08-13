"use client";

// app/(auth)/login/page.tsx
// Host portal login page.
// – Calls POST /api/v1/auth/login
// – Saves token + role + name + email to 30-day cookies
// – Blocks CUSTOMER role with an inline error
// – Redirects all host roles to /overview

import { useState, useEffect, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginUser, isHostRole } from "@/service/authService";
import { saveAuthCookies } from "@/lib/cookies";
import { AxiosError } from "axios";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FieldErrors {
  email?: string;
  password?: string;
}

// ─── Inline validation (mirrors backend constraints) ──────────────────────────

function validate(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter a valid email address.";
  }
  if (!password) {
    errors.password = "Password is required.";
  } else if (password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }
  return errors;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [showPass,    setShowPass]    = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [apiError,    setApiError]    = useState<string | null>(null);
  const [loading,     setLoading]     = useState(false);

  // Show "unauthorized" banner when middleware bounces a non-host user
  const unauthorizedParam = searchParams.get("error") === "unauthorized";
  useEffect(() => {
    if (unauthorizedParam) {
      setApiError("Your account does not have access to the host portal.");
    }
  }, [unauthorizedParam]);

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setApiError(null);

    const errors = validate(email, password);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setLoading(true);

    try {
      const data = await loginUser({ email, password });

      // Block customer accounts from the host portal
      if (!isHostRole(data.role)) {
        setApiError("This portal is for staff and administrators only.");
        setLoading(false);
        return;
      }

      saveAuthCookies({
        token:    data.token,
        role:     data.role,
        fullName: data.fullName,
        email:    data.email,
      });

      router.push("/overview");
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      const msg =
        axiosErr.response?.data?.message ??
        (axiosErr.response?.status === 401
          ? "Incorrect email or password."
          : "Something went wrong. Please try again.");
      setApiError(msg);
      setLoading(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-md px-4">
      {/* Card */}
      <div
        className="rounded-2xl shadow-lg overflow-hidden"
        style={{ backgroundColor: "var(--color-bg)" }}
      >
        {/* Header strip */}
        <div
          className="px-8 py-6 text-center"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          {/* Logo / wordmark */}
          <div className="flex items-center justify-center gap-2 mb-1">
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              aria-hidden="true"
            >
              <rect width="28" height="28" rx="8" fill="#facc15" />
              <path
                d="M6 18h16M8 14l3-5h6l3 5"
                stroke="#1f2937"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="10" cy="19" r="1.5" fill="#1f2937" />
              <circle cx="18" cy="19" r="1.5" fill="#1f2937" />
            </svg>
            <span
              className="text-xl font-bold tracking-tight"
              style={{ color: "#facc15", fontFamily: "var(--font-sans)" }}
            >
            Rentro
            </span>
          </div>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>
            Host Portal
          </p>
        </div>

        {/* Form area */}
        <div className="px-8 py-8">
          <h1
            className="text-2xl font-semibold mb-1"
            style={{ color: "var(--color-text)", fontFamily: "var(--font-sans)" }}
          >
            Welcome back
          </h1>
          <p className="text-sm mb-6" style={{ color: "var(--color-subtle)" }}>
            Sign in to manage Rentro
          </p>

          {/* API / role error banner */}
          {apiError && (
            <div
              className="flex items-start gap-3 rounded-lg px-4 py-3 mb-5 text-sm"
              style={{
                backgroundColor: "var(--color-danger-tint-6)",
                border: "1px solid var(--color-danger-tint-20)",
                color: "var(--color-danger)",
              }}
              role="alert"
            >
              <svg
                className="mt-0.5 shrink-0"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm.75 4a.75.75 0 0 0-1.5 0v3.5a.75.75 0 0 0 1.5 0V5zm-.75 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
              </svg>
              <span>{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Email field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--color-text)" }}
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
                }}
                placeholder="you@example.com"
                className="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all"
                style={{
                  border: `1px solid ${fieldErrors.email ? "var(--color-danger)" : "var(--color-border)"}`,
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-text)",
                  fontFamily: "var(--font-sans)",
                }}
                aria-describedby={fieldErrors.email ? "email-error" : undefined}
                aria-invalid={!!fieldErrors.email}
              />
              {fieldErrors.email && (
                <p
                  id="email-error"
                  className="mt-1.5 text-xs"
                  style={{ color: "var(--color-danger)" }}
                >
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--color-text)" }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
                  }}
                  placeholder="••••••••"
                  className="w-full rounded-lg px-4 py-2.5 pr-11 text-sm outline-none transition-all"
                  style={{
                    border: `1px solid ${fieldErrors.password ? "var(--color-danger)" : "var(--color-border)"}`,
                    backgroundColor: "var(--color-surface)",
                    color: "var(--color-text)",
                    fontFamily: "var(--font-sans)",
                  }}
                  aria-describedby={fieldErrors.password ? "password-error" : undefined}
                  aria-invalid={!!fieldErrors.password}
                />
                {/* Toggle visibility */}
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded"
                  style={{ color: "var(--color-subtle)" }}
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p
                  id="password-error"
                  className="mt-1.5 text-xs"
                  style={{ color: "var(--color-danger)" }}
                >
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg py-2.5 text-sm font-semibold transition-opacity mt-1"
              style={{
                backgroundColor: loading ? "var(--color-secondary)" : "var(--color-primary)",
                color: "#ffffff",
                fontFamily: "var(--font-sans)",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.75 : 1,
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" />
                  </svg>
                  Signing in…
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          {/* Footer note */}
          <p
            className="mt-6 text-center text-xs"
            style={{ color: "var(--color-subtle)" }}
          >
            Don&apos;t have an account?{" "}
            <span style={{ color: "var(--color-info)" }}>
              Contact your administrator.
            </span>
          </p>
        </div>
      </div>

      {/* Bottom caption */}
      <p
        className="mt-4 text-center text-xs"
        style={{ color: "var(--color-subtle)" }}
      >
        © {new Date().getFullYear()} CarRental Host Portal. All rights reserved.
      </p>
    </div>
  );
}
