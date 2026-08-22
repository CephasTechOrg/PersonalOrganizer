import { z } from "zod";

const statuses = ["todo", "in_progress", "done", "cancelled"] as const;
const priorities = ["low", "normal", "high", "urgent"] as const;
const kinds = ["apply", "download", "review", "contact", "attend", "complete", "other"] as const;
const optionalDate = z.union([z.null(), z.coerce.date()]).optional();
const webUrl = z.string().url().refine((value) => {
  const protocol = new URL(value).protocol;
  return protocol === "http:" || protocol === "https:";
}, "URL must use http or https");
const optionalUrl = z.union([webUrl, z.literal(""), z.null()]).transform((value) => value || null);

export const createTaskSchema = z.object({
  opportunityId: z.string().uuid().nullable().optional(),
  title: z.string().trim().min(1).max(300),
  notes: z.string().trim().max(10000).nullable().optional(),
  kind: z.enum(kinds).default("complete"),
  actionUrl: optionalUrl.optional(),
  status: z.enum(statuses).default("todo"),
  priority: z.enum(priorities).default("normal"),
  dueAt: optionalDate,
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  completedAt: optionalDate,
});

export const taskListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  q: z.string().trim().max(200).optional(),
  status: z.enum(statuses).optional(),
  priority: z.enum(priorities).optional(),
  kind: z.enum(kinds).optional(),
  opportunityId: z.string().uuid().optional(),
  dueBefore: z.coerce.date().optional(),
  dueAfter: z.coerce.date().optional(),
  sort: z.enum(["due", "created", "updated", "title"]).default("due"),
  order: z.enum(["asc", "desc"]).default("asc"),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskListQuery = z.infer<typeof taskListQuerySchema>;
