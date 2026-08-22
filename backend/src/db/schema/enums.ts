import { pgEnum } from "drizzle-orm/pg-core";

export const opportunityTypeEnum = pgEnum("opportunity_type", [
  "internship",
  "fellowship",
  "program",
  "startup_program",
  "funding",
  "competition",
  "event",
  "other",
]);

export const opportunityStatusEnum = pgEnum("opportunity_status", [
  "saved",
  "need_to_apply",
  "in_progress",
  "applied",
  "waiting",
  "interview",
  "accepted",
  "rejected",
  "withdrawn",
  "archived",
]);

export const priorityEnum = pgEnum("priority", ["low", "normal", "high", "urgent"]);

export const taskStatusEnum = pgEnum("task_status", [
  "todo",
  "in_progress",
  "done",
  "cancelled",
]);

export const taskKindEnum = pgEnum("task_kind", [
  "apply",
  "download",
  "review",
  "contact",
  "attend",
  "complete",
  "other",
]);

export const auditEntityEnum = pgEnum("audit_entity", ["opportunity", "task", "auth"]);
