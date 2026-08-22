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
  await requireSession();
  const { id } = await context.params;
  return ok(await getOpportunity(idSchema.parse(id)));
});

export const PATCH = withErrorHandling(async (request: Request, context: Context) => {
  assertSameOrigin(request);
  await requireSession();
  const { id } = await context.params;
  const input = await parseJson(request, updateOpportunitySchema);
  return ok(await updateOpportunity(idSchema.parse(id), input));
});

export const DELETE = withErrorHandling(async (request: Request, context: Context) => {
  assertSameOrigin(request);
  await requireSession();
  const { id } = await context.params;
  await deleteOpportunity(idSchema.parse(id));
  return noContent();
});
