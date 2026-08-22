import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import { AppShell } from "@/ui/shell/AppShell";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  let email: string;
  try {
    const session = await requireSession();
    email = session.email;
  } catch {
    redirect("/login");
  }

  return <AppShell ownerEmail={email}>{children}</AppShell>;
}
