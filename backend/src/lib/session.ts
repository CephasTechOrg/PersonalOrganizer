import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getEnv } from "@/lib/env";
import { UnauthorizedError } from "@/lib/errors";

const COOKIE_NAME = "personal_hub_session";
const ISSUER = "personal-hub";
const AUDIENCE = "personal-hub-user";
const SESSION_SECONDS = 60 * 60 * 24 * 7;

export type SessionUser = {
  userId: string;
  email: string;
};

function secret() {
  return new TextEncoder().encode(getEnv().AUTH_SECRET);
}

export async function createSessionToken(user: SessionUser) {
  return new SignJWT({ email: user.email, role: "user" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.userId)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_SECONDS}s`)
    .sign(secret());
}

export async function verifySessionToken(token: string): Promise<SessionUser> {
  const { payload } = await jwtVerify(token, secret(), {
    issuer: ISSUER,
    audience: AUDIENCE,
  });

  const userId = payload.sub;
  const email = typeof payload.email === "string" ? payload.email : null;
  if (!userId || !email || payload.role !== "user") {
    throw new UnauthorizedError();
  }

  return { userId, email };
}

export async function requireSession(): Promise<SessionUser> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) throw new UnauthorizedError();

  try {
    return await verifySessionToken(token);
  } catch {
    throw new UnauthorizedError();
  }
}

export const sessionCookie = {
  name: COOKIE_NAME,
  maxAge: SESSION_SECONDS,
};
