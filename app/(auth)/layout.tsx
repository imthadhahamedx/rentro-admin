// app/(auth)/layout.tsx
// Full-screen centred layout used by the login page.
// No sidebar, no header — clean auth shell.

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "var(--dash-body-bg)" }}
    >
      {children}
    </div>
  );
}
