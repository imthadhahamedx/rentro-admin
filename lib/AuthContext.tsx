"use client";

// lib/AuthContext.tsx
// Provides the current user (role, name, email) to every dashboard page.
// Reads from cookies on mount so there is no flicker on page load.

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  getCookie,
  clearAuthCookies,
  TOKEN_COOKIE,
  ROLE_COOKIE,
  NAME_COOKIE,
  EMAIL_COOKIE,
} from "./cookies";

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole = "STAFF" | "ADMIN" | "SUPER_ADMIN";

export interface AuthUser {
  token: string;
  role: UserRole;
  fullName: string;
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  logout: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  logout: () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const router  = useRouter();
  const [user,    setUser]    = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token    = getCookie(TOKEN_COOKIE);
    const role     = getCookie(ROLE_COOKIE);
    const fullName = getCookie(NAME_COOKIE);
    const email    = getCookie(EMAIL_COOKIE);

    if (token && role && fullName && email) {
      setUser({ token, role: role as UserRole, fullName, email });
    }
    setLoading(false);
  }, []);

  function logout() {
    clearAuthCookies();
    setUser(null);
    router.push("/login");
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
