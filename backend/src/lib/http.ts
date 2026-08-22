import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError, ValidationError } from "@/lib/errors";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function created<T>(data: T) {
  return NextResponse.json({ data }, { status: 201 });
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function paginated<T>(data: T[], page: number, limit: number, total: number) {
  return NextResponse.json({
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export function toErrorResponse(error: unknown) {
  if (error instanceof ZodError) {
    error = new ValidationError("Invalid request", error.flatten());
  }

  if (error instanceof AppError) {
    const headers = new Headers();
    if (error.status === 429 && typeof error.details === "object" && error.details) {
      const retryAfter = (error.details as { retryAfterSeconds?: number }).retryAfterSeconds;
      if (retryAfter) headers.set("Retry-After", String(retryAfter));
    }

    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.status, headers },
    );
  }

  console.error(error);
  return NextResponse.json(
    { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
    { status: 500 },
  );
}

export function withErrorHandling<TArgs extends unknown[]>(
  handler: (...args: TArgs) => Promise<Response>,
) {
  return async (...args: TArgs) => {
    try {
      return await handler(...args);
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}
