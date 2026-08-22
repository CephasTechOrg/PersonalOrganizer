import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { ok, withErrorHandling } from "@/lib/http";

export const runtime = "nodejs";

export const GET = withErrorHandling(async () => {
  const db = getDb();
  await db.execute(sql`select 1`);
  return ok({ status: "ok", database: "reachable", timestamp: new Date() });
});
