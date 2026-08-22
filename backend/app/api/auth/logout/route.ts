import { ok, withErrorHandling } from "@/lib/http";
import { assertSameOrigin } from "@/lib/request";
import { requireSession, sessionCookie } from "@/lib/session";

export const runtime = "nodejs";

export const POST = withErrorHandling(async (request: Request) => {
  assertSameOrigin(request);
  await requireSession();
  const response = ok({ signedOut: true });
  response.cookies.set(sessionCookie.name, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return response;
});
