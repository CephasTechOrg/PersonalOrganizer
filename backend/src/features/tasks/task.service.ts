import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  lte,
  type SQL,
} from "drizzle-orm";
import { tasks } from "@/db/schema";
import { recordAudit } from "@/features/audit/audit.service";
import { getDb } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";
import type { CreateTaskInput, TaskListQuery, UpdateTaskInput } from "./task.schemas";

export async function createTask(input: CreateTaskInput) {
  const db = getDb();
  const now = new Date();
  const [created] = await db
    .insert(tasks)
    .values({
      ...input,
      completedAt: input.status === "done" ? now : undefined,
    })
    .returning();

  await recordAudit({
    entityType: "task",
    entityId: created.id,
    action: "created",
    metadata: { opportunityId: created.opportunityId },
  });
  return created;
}

export async function listTasks(query: TaskListQuery) {
  const db = getDb();
  const conditions: SQL[] = [];

  if (query.status) conditions.push(eq(tasks.status, query.status));
  if (query.priority) conditions.push(eq(tasks.priority, query.priority));
  if (query.kind) conditions.push(eq(tasks.kind, query.kind));
  if (query.opportunityId) conditions.push(eq(tasks.opportunityId, query.opportunityId));
  if (query.dueBefore) conditions.push(lte(tasks.dueAt, query.dueBefore));
  if (query.dueAfter) conditions.push(gte(tasks.dueAt, query.dueAfter));
  if (query.q) conditions.push(ilike(tasks.title, `%${query.q}%`));

  const where = conditions.length ? and(...conditions) : undefined;
  const sortColumn = {
    due: tasks.dueAt,
    created: tasks.createdAt,
    updated: tasks.updatedAt,
    title: tasks.title,
  }[query.sort];
  const orderBy = query.order === "desc" ? desc(sortColumn) : asc(sortColumn);
  const offset = (query.page - 1) * query.limit;

  const [rows, totalRows] = await Promise.all([
    db
      .select()
      .from(tasks)
      .where(where)
      .orderBy(orderBy, desc(tasks.createdAt))
      .limit(query.limit)
      .offset(offset),
    db.select({ value: count() }).from(tasks).where(where),
  ]);

  return { rows, total: totalRows[0]?.value ?? 0 };
}

export async function getTask(id: string) {
  const db = getDb();
  const [row] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  if (!row) throw new NotFoundError("Task not found");
  return row;
}

export async function updateTask(id: string, input: UpdateTaskInput) {
  const db = getDb();
  await getTask(id);

  const values: Partial<typeof tasks.$inferInsert> = { ...input, updatedAt: new Date() };
  if (input.status === "done" && input.completedAt === undefined) values.completedAt = new Date();
  if (input.status && input.status !== "done" && input.completedAt === undefined) values.completedAt = null;

  const [updated] = await db.update(tasks).set(values).where(eq(tasks.id, id)).returning();
  await recordAudit({
    entityType: "task",
    entityId: id,
    action: "updated",
    metadata: { fields: Object.keys(input) },
  });
  return updated;
}

export async function deleteTask(id: string) {
  const db = getDb();
  const existing = await getTask(id);
  await db.delete(tasks).where(eq(tasks.id, id));
  await recordAudit({
    entityType: "task",
    entityId: id,
    action: "deleted",
    metadata: { title: existing.title },
  });
}
