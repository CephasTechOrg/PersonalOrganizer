import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  lte,
  or,
  type SQL,
} from "drizzle-orm";
import { opportunities } from "@/db/schema";
import { recordAudit } from "@/features/audit/audit.service";
import { getDb } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";
import type {
  CreateOpportunityInput,
  OpportunityListQuery,
  UpdateOpportunityInput,
} from "./opportunity.schemas";

export async function createOpportunity(userId: string, input: CreateOpportunityInput) {
  const db = getDb();
  const now = new Date();
  const values = {
    ...input,
    userId,
    appliedAt: ["applied", "waiting", "interview", "accepted", "rejected"].includes(input.status)
      ? now
      : undefined,
    archivedAt: input.status === "archived" ? now : undefined,
  };

  const [created] = await db.insert(opportunities).values(values).returning();
  await recordAudit({
    entityType: "opportunity",
    entityId: created.id,
    action: "created",
    metadata: { status: created.status, type: created.type, userId },
  });
  return created;
}

export async function listOpportunities(userId: string, query: OpportunityListQuery) {
  const db = getDb();
  const conditions: SQL[] = [eq(opportunities.userId, userId)];

  if (query.status) conditions.push(eq(opportunities.status, query.status));
  if (query.type) conditions.push(eq(opportunities.type, query.type));
  if (query.priority) conditions.push(eq(opportunities.priority, query.priority));
  if (query.deadlineBefore) conditions.push(lte(opportunities.deadlineAt, query.deadlineBefore));
  if (query.deadlineAfter) conditions.push(gte(opportunities.deadlineAt, query.deadlineAfter));
  if (query.openBefore) conditions.push(lte(opportunities.openAt, query.openBefore));
  if (query.openAfter) conditions.push(gte(opportunities.openAt, query.openAfter));
  if (query.q) {
    const pattern = `%${query.q}%`;
    conditions.push(
      or(
        ilike(opportunities.title, pattern),
        ilike(opportunities.organization, pattern),
        ilike(opportunities.description, pattern),
        ilike(opportunities.notes, pattern),
      )!,
    );
  }

  const where = and(...conditions);
  const sortColumn = {
    deadline: opportunities.deadlineAt,
    opening: opportunities.openAt,
    created: opportunities.createdAt,
    updated: opportunities.updatedAt,
    title: opportunities.title,
  }[query.sort];
  const orderBy = query.order === "desc" ? desc(sortColumn) : asc(sortColumn);
  const offset = (query.page - 1) * query.limit;

  const [rows, totalRows] = await Promise.all([
    db
      .select()
      .from(opportunities)
      .where(where)
      .orderBy(orderBy, desc(opportunities.createdAt))
      .limit(query.limit)
      .offset(offset),
    db.select({ value: count() }).from(opportunities).where(where),
  ]);

  return { rows, total: totalRows[0]?.value ?? 0 };
}

export async function getOpportunity(userId: string, id: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(opportunities)
    .where(and(eq(opportunities.id, id), eq(opportunities.userId, userId)))
    .limit(1);
  if (!row) throw new NotFoundError("Opportunity not found");
  return row;
}

export async function updateOpportunity(userId: string, id: string, input: UpdateOpportunityInput) {
  const db = getDb();
  await getOpportunity(userId, id);

  const values: Partial<typeof opportunities.$inferInsert> = { ...input, updatedAt: new Date() };
  if (
    input.status &&
    ["applied", "waiting", "interview", "accepted", "rejected"].includes(input.status) &&
    input.appliedAt === undefined
  ) {
    values.appliedAt = new Date();
  }
  if (input.status === "archived" && input.archivedAt === undefined) {
    values.archivedAt = new Date();
  }

  const [updated] = await db
    .update(opportunities)
    .set(values)
    .where(and(eq(opportunities.id, id), eq(opportunities.userId, userId)))
    .returning();

  await recordAudit({
    entityType: "opportunity",
    entityId: id,
    action: "updated",
    metadata: { fields: Object.keys(input), userId },
  });
  return updated;
}

export async function deleteOpportunity(userId: string, id: string) {
  const db = getDb();
  const existing = await getOpportunity(userId, id);
  await db
    .delete(opportunities)
    .where(and(eq(opportunities.id, id), eq(opportunities.userId, userId)));
  await recordAudit({
    entityType: "opportunity",
    entityId: id,
    action: "deleted",
    metadata: { title: existing.title, userId },
  });
}
