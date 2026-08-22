import { authenticateOwner } from "@/features/auth/auth.service";
import { loginSchema } from "@/features/auth/auth.schemas";
import { ok, withErrorHandling } from "@/lib/http";
import { assertSameOrigin, parseJson } from "@/lib/request";
import { createSessionToken, sessionCookie } from "@/lib/session";

export const runtime = "nodejs";

export const POST = withErrorHandling(async (request: Request) => {
  assertSameOrigin(request);
  const input = await parseJson(request, loginSchema);
  const owner = await authenticateOwner(request, input.email, input.password);
  const token = await createSessionToken();
  const response = ok(owner);

  response.cookies.set(sessionCookie.name, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: sessionCookie.maxAge,
  });

  return response;
});
