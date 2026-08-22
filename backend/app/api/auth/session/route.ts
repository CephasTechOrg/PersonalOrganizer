import { ok, withErrorHandling } from "@/lib/http";
import { requireSession } from "@/lib/session";

export const runtime = "nodejs";

export const GET = withErrorHandling(async () => {
  const session = await requireSession();
  return ok(session);
});
