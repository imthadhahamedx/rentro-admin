// app/(dashboard)/layout.tsx
"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./_components/Sidebar";

function pageTitleFromPath(pathname: string): string {
    const segment = pathname.split("/").filter(Boolean)[0] ?? "overview";
    return segment
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}

export default function DashboardLayout({
                                            children,
                                        }: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const pathname = usePathname();

    return (
        <div className="flex min-h-screen" style={{ backgroundColor: "var(--dash-body-bg)" }}>
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex min-w-0 flex-1 flex-col">
                {/* Header */}
                <header
                    className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 px-4 sm:px-6"
                    style={{
                        backgroundColor: "var(--dash-header-bg)",
                        boxShadow: "var(--dash-header-shadow)",
                    }}
                >
                    {/* Mobile menu toggle */}
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="rounded-md p-2 text-text hover:bg-body lg:hidden"
                        aria-label="Open menu"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                            <path d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    <h2 className="text-base font-semibold text-text">
                        {pageTitleFromPath(pathname)}
                    </h2>
                </header>

                {/* Page content */}
                <main className="flex-1 p-4 sm:p-6">{children}</main>
            </div>
        </div>
    );
}