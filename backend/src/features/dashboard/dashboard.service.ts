import { and, asc, count, gte, inArray, isNotNull, lt, lte } from "drizzle-orm";
import { opportunities, tasks } from "@/db/schema";
import { getDb } from "@/lib/db";

const ACTIVE_APPLICATION_STATUSES = ["saved", "need_to_apply", "in_progress"] as const;
const WAITING_STATUSES = ["applied", "waiting"] as const;
const ACTIVE_TASK_STATUSES = ["todo", "in_progress"] as const;

export async function getDashboard() {
  const db = getDb();
  const now = new Date();
  const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    statusCounts,
    dueSoon,
    overdue,
    followUps,
    upcomingTasks,
    overdueTasks,
    overdueCount,
  ] = await Promise.all([
    db
      .select({ status: opportunities.status, count: count() })
      .from(opportunities)
      .groupBy(opportunities.status),
    db
      .select()
      .from(opportunities)
      .where(
        and(
          inArray(opportunities.status, [...ACTIVE_APPLICATION_STATUSES]),
          isNotNull(opportunities.deadlineAt),
          gte(opportunities.deadlineAt, now),
          lte(opportunities.deadlineAt, sevenDays),
        ),
      )
      .orderBy(asc(opportunities.deadlineAt))
      .limit(10),
    db
      .select()
      .from(opportunities)
      .where(
        and(
          inArray(opportunities.status, [...ACTIVE_APPLICATION_STATUSES]),
          isNotNull(opportunities.deadlineAt),
          lt(opportunities.deadlineAt, now),
        ),
      )
      .orderBy(asc(opportunities.deadlineAt))
      .limit(10),
    db
      .select()
      .from(opportunities)
      .where(
        and(
          inArray(opportunities.status, [...WAITING_STATUSES]),
          isNotNull(opportunities.followUpAt),
          lte(opportunities.followUpAt, now),
        ),
      )
      .orderBy(asc(opportunities.followUpAt))
      .limit(10),
    db
      .select()
      .from(tasks)
      .where(
        and(
          inArray(tasks.status, [...ACTIVE_TASK_STATUSES]),
          isNotNull(tasks.dueAt),
          gte(tasks.dueAt, now),
          lte(tasks.dueAt, sevenDays),
        ),
      )
      .orderBy(asc(tasks.dueAt))
      .limit(10),
    db
      .select()
      .from(tasks)
      .where(
        and(
          inArray(tasks.status, [...ACTIVE_TASK_STATUSES]),
          isNotNull(tasks.dueAt),
          lt(tasks.dueAt, now),
        ),
      )
      .orderBy(asc(tasks.dueAt))
      .limit(10),
    db
      .select({ value: count() })
      .from(opportunities)
      .where(
        and(
          inArray(opportunities.status, [...ACTIVE_APPLICATION_STATUSES]),
          isNotNull(opportunities.deadlineAt),
          lt(opportunities.deadlineAt, now),
        ),
      ),
  ]);

  const counts = Object.fromEntries(statusCounts.map((row) => [row.status, row.count]));
  const needsAttention = [...overdue, ...dueSoon].slice(0, 10);

  return {
    generatedAt: now,
    counts,
    overdueCount: overdueCount[0]?.value ?? 0,
    needsAttention,
    overdue,
    dueSoon,
    followUps,
    overdueTasks,
    upcomingTasks,
  };
}
