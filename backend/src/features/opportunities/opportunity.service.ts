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

export async function createOpportunity(input: CreateOpportunityInput) {
  const db = getDb();
  const now = new Date();
  const values = {
    ...input,
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
    metadata: { status: created.status, type: created.type },
  });
  return created;
}

export async function listOpportunities(query: OpportunityListQuery) {
  const db = getDb();
  const conditions: SQL[] = [];

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

  const where = conditions.length ? and(...conditions) : undefined;
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

export async function getOpportunity(id: string) {
  const db = getDb();
  const [row] = await db.select().from(opportunities).where(eq(opportunities.id, id)).limit(1);
  if (!row) throw new NotFoundError("Opportunity not found");
  return row;
}

export async function updateOpportunity(id: string, input: UpdateOpportunityInput) {
  const db = getDb();
  await getOpportunity(id);

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
    .where(eq(opportunities.id, id))
    .returning();

  await recordAudit({
    entityType: "opportunity",
    entityId: id,
    action: "updated",
    metadata: { fields: Object.keys(input) },
  });
  return updated;
}

export async function deleteOpportunity(id: string) {
  const db = getDb();
  const existing = await getOpportunity(id);
  await db.delete(opportunities).where(eq(opportunities.id, id));
  await recordAudit({
    entityType: "opportunity",
    entityId: id,
    action: "deleted",
    metadata: { title: existing.title },
  });
}
