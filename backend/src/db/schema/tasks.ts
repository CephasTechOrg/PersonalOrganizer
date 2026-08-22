import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { opportunities } from "./opportunities";
import { priorityEnum, taskKindEnum, taskStatusEnum } from "./enums";

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    opportunityId: uuid("opportunity_id").references(() => opportunities.id, {
      onDelete: "cascade",
    }),
    title: text("title").notNull(),
    notes: text("notes"),
    kind: taskKindEnum("kind").notNull().default("complete"),
    actionUrl: text("action_url"),
    status: taskStatusEnum("status").notNull().default("todo"),
    priority: priorityEnum("priority").notNull().default("normal"),
    dueAt: timestamp("due_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("tasks_opportunity_idx").on(table.opportunityId),
    index("tasks_status_idx").on(table.status),
    index("tasks_kind_idx").on(table.kind),
    index("tasks_due_idx").on(table.dueAt),
  ],
);
