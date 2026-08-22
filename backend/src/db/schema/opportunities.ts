import { index, pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { opportunityStatusEnum, opportunityTypeEnum, priorityEnum } from "./enums";

export const opportunities = pgTable(
  "opportunities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    organization: text("organization"),
    type: opportunityTypeEnum("type").notNull().default("program"),
    status: opportunityStatusEnum("status").notNull().default("saved"),
    priority: priorityEnum("priority").notNull().default("normal"),
    sourceUrl: text("source_url"),
    applicationUrl: text("application_url"),
    description: text("description"),
    notes: text("notes"),
    nextAction: text("next_action"),
    location: text("location"),
    isRemote: boolean("is_remote"),
    openAt: timestamp("open_at", { withTimezone: true }),
    deadlineAt: timestamp("deadline_at", { withTimezone: true }),
    followUpAt: timestamp("follow_up_at", { withTimezone: true }),
    appliedAt: timestamp("applied_at", { withTimezone: true }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("opportunities_status_idx").on(table.status),
    index("opportunities_type_idx").on(table.type),
    index("opportunities_open_idx").on(table.openAt),
    index("opportunities_deadline_idx").on(table.deadlineAt),
    index("opportunities_follow_up_idx").on(table.followUpAt),
    index("opportunities_created_idx").on(table.createdAt),
  ],
);
