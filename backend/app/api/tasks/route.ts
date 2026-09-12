import { createTaskSchema, taskListQuerySchema } from "@/features/tasks/task.schemas";
import { createTask, listTasks } from "@/features/tasks/task.service";
import { created, paginated, withErrorHandling } from "@/lib/http";
import { assertSameOrigin, parseJson } from "@/lib/request";
import { requireSession } from "@/lib/session";

export const runtime = "nodejs";

export const GET = withErrorHandling(async (request: Request) => {
  const session = await requireSession();
  const url = new URL(request.url);
  const query = taskListQuerySchema.parse(Object.fromEntries(url.searchParams));
  const result = await listTasks(session.userId, query);
  return paginated(result.rows, query.page, query.limit, result.total);
});

export const POST = withErrorHandling(async (request: Request) => {
  assertSameOrigin(request);
  const session = await requireSession();
  const input = await parseJson(request, createTaskSchema);
  return created(await createTask(session.userId, input));
});
