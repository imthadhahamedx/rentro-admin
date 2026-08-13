// app/page.tsx
// Root route — middleware handles the redirect logic,
// but we add a server-side safety net here too.

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { TOKEN_COOKIE, ROLE_COOKIE } from "@/lib/cookies";

const ALLOWED_ROLES = ["STAFF", "ADMIN", "SUPER_ADMIN"];

export default async function RootPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;
  const role  = cookieStore.get(ROLE_COOKIE)?.value;

  if (token && role && ALLOWED_ROLES.includes(role)) {
    redirect("/overview");
  }

  redirect("/login");
}
