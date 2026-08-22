import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import { LoginForm } from "./LoginForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  let authenticated = false;
  try {
    await requireSession();
    authenticated = true;
  } catch {
    authenticated = false;
  }

  if (authenticated) redirect("/");

  return <LoginForm />;
}
