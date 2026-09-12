import { createHmac } from "node:crypto";
import { eq } from "drizzle-orm";
import { authThrottles, users } from "@/db/schema";
import { getDb } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { RateLimitError, UnauthorizedError } from "@/lib/errors";
import { verifyPassword } from "@/lib/password";
import { recordAudit } from "@/features/audit/audit.service";

const WINDOW_MS = 15 * 60 * 1000;
const BLOCK_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function clientKey(request: Request, email: string) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip") || "unknown";
  return createHmac("sha256", getEnv().AUTH_SECRET).update(`${ip}:${email}`).digest("hex");
}

async function assertLoginAllowed(key: string) {
  const db = getDb();
  const [row] = await db.select().from(authThrottles).where(eq(authThrottles.key, key)).limit(1);
  if (!row?.blockedUntil) return;

  const remaining = row.blockedUntil.getTime() - Date.now();
  if (remaining > 0) throw new RateLimitError(Math.ceil(remaining / 1000));
}

async function registerFailure(key: string) {
  const db = getDb();
  const now = new Date();
  const [current] = await db.select().from(authThrottles).where(eq(authThrottles.key, key)).limit(1);

  const windowExpired = !current || now.getTime() - current.windowStartedAt.getTime() > WINDOW_MS;
  const attempts = windowExpired ? 1 : current.attempts + 1;
  const blockedUntil = attempts >= MAX_ATTEMPTS ? new Date(now.getTime() + BLOCK_MS) : null;

  await db
    .insert(authThrottles)
    .values({
      key,
      attempts,
      windowStartedAt: windowExpired ? now : current.windowStartedAt,
      blockedUntil,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: authThrottles.key,
      set: {
        attempts,
        windowStartedAt: windowExpired ? now : current!.windowStartedAt,
        blockedUntil,
        updatedAt: now,
      },
    });
}

async function clearFailures(key: string) {
  const db = getDb();
  await db.delete(authThrottles).where(eq(authThrottles.key, key));
}

export async function authenticateUser(request: Request, email: string, password: string) {
  const normalizedEmail = email.toLowerCase();
  const key = clientKey(request, normalizedEmail);
  await assertLoginAllowed(key);

  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
  const passwordMatches = user ? await verifyPassword(password, user.passwordHash) : false;

  if (!user || !passwordMatches) {
    await registerFailure(key);
    await recordAudit({ entityType: "auth", action: "login_failed" });
    throw new UnauthorizedError("Invalid email or password");
  }

  await clearFailures(key);
  await recordAudit({
    entityType: "auth",
    action: "login_succeeded",
    metadata: { userId: user.id },
  });
  return { userId: user.id, email: user.email };
}

/** @deprecated Use authenticateUser */
export const authenticateOwner = authenticateUser;
