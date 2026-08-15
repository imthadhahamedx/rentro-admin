// app/(dashboard)/_components/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { useAuth, UserRole } from "@/lib/AuthContext";

// ─── Icons (inline, no external icon package) ────────────────────────────────

const icon = (path: ReactNode) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-[18px] w-[18px]">
        {path}
    </svg>
);

const Icons = {
    overview: icon(<><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>),
    bookings: icon(<><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>),
    vehicles: icon(<><path d="M3 13l1.5-4.5A2 2 0 0 1 6.4 7h11.2a2 2 0 0 1 1.9 1.5L21 13" /><path d="M3 13h18v4a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H6v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4Z" /><circle cx="7.5" cy="17.5" r="1.5" /><circle cx="16.5" cy="17.5" r="1.5" /></>),
    customers: icon(<><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3 2.7-5 6-5s6 2 6 5" /><circle cx="17" cy="9" r="2.5" /><path d="M15.5 15.2c2.6.4 4.5 2.1 4.5 4.8" /></>),
    damage: icon(<><path d="M12 3 2 20h20L12 3Z" /><path d="M12 10v4M12 17h.01" /></>),
    reports: icon(<><path d="M3 3v18h18" /><path d="M7 15l4-5 3 3 5-7" /></>),
    locations: icon(<><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.3" /></>),
    payments: icon(<><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></>),
    staff: icon(<><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" /></>),
    settings: icon(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></>),
    logout: icon(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></>),
};

interface NavItem {
    label: string;
    href: string;
    icon: ReactNode;
    roles?: UserRole[]; // omit = visible to all host roles
}

const NAV_ITEMS: NavItem[] = [
    { label: "Overview", href: "/overview", icon: Icons.overview },
    { label: "Bookings", href: "/bookings", icon: Icons.bookings },
    { label: "Vehicles", href: "/vehicles", icon: Icons.vehicles },
    { label: "Customers", href: "/customers", icon: Icons.customers },
    { label: "Damage", href: "/damage", icon: Icons.damage },
    { label: "Damage Reports", href: "/damage-reports", icon: Icons.damage },
    { label: "Payments", href: "/payments", icon: Icons.payments },
    { label: "Locations", href: "/locations", icon: Icons.locations },
    { label: "Reports", href: "/reports", icon: Icons.reports },
    { label: "Staff", href: "/staff", icon: Icons.staff, roles: ["ADMIN", "SUPER_ADMIN"] },
    { label: "Settings", href: "/settings", icon: Icons.settings, roles: ["ADMIN", "SUPER_ADMIN"] },
];

function initials(name: string): string {
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

interface SidebarProps {
    open: boolean;
    onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    const visibleItems = NAV_ITEMS.filter(
        (item) => !item.roles || (user && item.roles.includes(user.role))
    );

    return (
        <>
            {/* Mobile backdrop */}
            {open && (
                <div
                    className="fixed inset-0 z-30 bg-black/40 lg:hidden"
                    onClick={onClose}
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col transition-transform duration-200 lg:static lg:translate-x-0 ${
                    open ? "translate-x-0" : "-translate-x-full"
                }`}
                style={{
                    backgroundColor: "var(--dash-sidebar-bg)",
                    borderRight: "1px solid var(--dash-sidebar-border)",
                }}
            >
                {/* Brand */}
                <div
                    className="flex h-16 shrink-0 items-center gap-2 px-5"
                    style={{ borderBottom: "1px solid var(--dash-sidebar-border)" }}
                >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-700 text-sm font-bold text-white">
                        CH
                    </div>
                    <span className="text-sm font-semibold" style={{ color: "var(--dash-sidebar-text)" }}>
            Rentro
          </span>
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto px-3 py-4">
                    <ul className="space-y-1">
                        {visibleItems.map((item) => {
                            const active = pathname === item.href || pathname.startsWith(item.href + "/");
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        onClick={onClose}
                                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                                        style={{
                                            color: active ? "var(--dash-sidebar-active)" : "var(--dash-sidebar-text)",
                                            backgroundColor: active ? "var(--dash-sidebar-active-bg)" : "transparent",
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!active) e.currentTarget.style.backgroundColor = "var(--dash-sidebar-hover)";
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!active) e.currentTarget.style.backgroundColor = "transparent";
                                        }}
                                    >
                                        {item.icon}
                                        {item.label}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* User / logout */}
                <div className="shrink-0 px-3 py-4" style={{ borderTop: "1px solid var(--dash-sidebar-border)" }}>
                    <div className="flex items-center gap-3 rounded-lg px-2 py-2">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-700 text-xs font-bold text-white">
                            {user ? initials(user.fullName) : "?"}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium" style={{ color: "var(--dash-sidebar-text)" }}>
                                {user?.fullName ?? "Loading..."}
                            </p>
                            <p className="truncate text-xs capitalize" style={{ color: "var(--dash-sidebar-muted)" }}>
                                {user?.role?.toLowerCase().replace("_", " ") ?? ""}
                            </p>
                        </div>
                        <button
                            onClick={logout}
                            title="Log out"
                            className="shrink-0 rounded-md p-1.5 transition-colors"
                            style={{ color: "var(--dash-sidebar-muted)" }}
                        >
                            {Icons.logout}
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}