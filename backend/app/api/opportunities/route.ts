import {
  createOpportunitySchema,
  opportunityListQuerySchema,
} from "@/features/opportunities/opportunity.schemas";
import {
  createOpportunity,
  listOpportunities,
} from "@/features/opportunities/opportunity.service";
import { created, paginated, withErrorHandling } from "@/lib/http";
import { assertSameOrigin, parseJson } from "@/lib/request";
import { requireSession } from "@/lib/session";

export const runtime = "nodejs";

export const GET = withErrorHandling(async (request: Request) => {
  await requireSession();
  const url = new URL(request.url);
  const query = opportunityListQuerySchema.parse(Object.fromEntries(url.searchParams));
  const result = await listOpportunities(query);
  return paginated(result.rows, query.page, query.limit, result.total);
});

export const POST = withErrorHandling(async (request: Request) => {
  assertSameOrigin(request);
  await requireSession();
  const input = await parseJson(request, createOpportunitySchema);
  return created(await createOpportunity(input));
});
