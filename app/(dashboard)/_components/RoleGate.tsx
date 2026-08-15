// app/(dashboard)/_components/RoleGate.tsx
// Wrap any UI (buttons, sections, nav items) that should only be visible to
// certain roles, e.g. <RoleGate allow={["ADMIN","SUPER_ADMIN"]}><DeleteBtn/></RoleGate>

"use client";

import { ReactNode } from "react";
import { useAuth, UserRole } from "@/lib/AuthContext";

interface RoleGateProps {
    allow: UserRole[];
    children: ReactNode;
    fallback?: ReactNode;
}

export default function RoleGate({ allow, children, fallback = null }: RoleGateProps) {
    const { user } = useAuth();

    if (!user || !allow.includes(user.role)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}