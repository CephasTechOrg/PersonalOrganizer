import { z } from "zod";
import { updateTaskSchema } from "@/features/tasks/task.schemas";
import { deleteTask, getTask, updateTask } from "@/features/tasks/task.service";
import { noContent, ok, withErrorHandling } from "@/lib/http";
import { assertSameOrigin, parseJson } from "@/lib/request";
import { requireSession } from "@/lib/session";

export const runtime = "nodejs";

const idSchema = z.string().uuid();
type Context = { params: Promise<{ id: string }> };

export const GET = withErrorHandling(async (_request: Request, context: Context) => {
  const session = await requireSession();
  const { id } = await context.params;
  return ok(await getTask(session.userId, idSchema.parse(id)));
});

export const PATCH = withErrorHandling(async (request: Request, context: Context) => {
  assertSameOrigin(request);
  const session = await requireSession();
  const { id } = await context.params;
  const input = await parseJson(request, updateTaskSchema);
  return ok(await updateTask(session.userId, idSchema.parse(id), input));
});

export const DELETE = withErrorHandling(async (request: Request, context: Context) => {
  assertSameOrigin(request);
  const session = await requireSession();
  const { id } = await context.params;
  await deleteTask(session.userId, idSchema.parse(id));
  return noContent();
});
