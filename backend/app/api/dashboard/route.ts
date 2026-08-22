import { getDashboard } from "@/features/dashboard/dashboard.service";
import { ok, withErrorHandling } from "@/lib/http";
import { requireSession } from "@/lib/session";

export const runtime = "nodejs";

export const GET = withErrorHandling(async () => {
  await requireSession();
  return ok(await getDashboard());
});
