import type { ZodType } from "zod";
import { ForbiddenError, ValidationError } from "@/lib/errors";

export async function parseJson<T>(request: Request, schema: ZodType<T>): Promise<T> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new ValidationError("Content-Type must be application/json");
  }

  const body = await request.json().catch(() => {
    throw new ValidationError("Request body must be valid JSON");
  });

  return schema.parse(body);
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return;

  const expected = new URL(request.url).origin;
  if (origin !== expected) throw new ForbiddenError("Cross-origin mutation rejected");
}
