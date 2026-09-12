import { z } from "zod";
import { updateOpportunitySchema } from "@/features/opportunities/opportunity.schemas";
import {
  deleteOpportunity,
  getOpportunity,
  updateOpportunity,
} from "@/features/opportunities/opportunity.service";
import { noContent, ok, withErrorHandling } from "@/lib/http";
import { assertSameOrigin, parseJson } from "@/lib/request";
import { requireSession } from "@/lib/session";

export const runtime = "nodejs";

const idSchema = z.string().uuid();
type Context = { params: Promise<{ id: string }> };

export const GET = withErrorHandling(async (_request: Request, context: Context) => {
  const session = await requireSession();
  const { id } = await context.params;
  return ok(await getOpportunity(session.userId, idSchema.parse(id)));
});

export const PATCH = withErrorHandling(async (request: Request, context: Context) => {
  assertSameOrigin(request);
  const session = await requireSession();
  const { id } = await context.params;
  const input = await parseJson(request, updateOpportunitySchema);
  return ok(await updateOpportunity(session.userId, idSchema.parse(id), input));
});

export const DELETE = withErrorHandling(async (request: Request, context: Context) => {
  assertSameOrigin(request);
  const session = await requireSession();
  const { id } = await context.params;
  await deleteOpportunity(session.userId, idSchema.parse(id));
  return noContent();
});
