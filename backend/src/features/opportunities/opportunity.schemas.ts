import { z } from "zod";

const opportunityTypes = [
  "internship",
  "fellowship",
  "program",
  "startup_program",
  "funding",
  "competition",
  "event",
  "other",
] as const;

const opportunityStatuses = [
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
] as const;

const priorities = ["low", "normal", "high", "urgent"] as const;
const webUrl = z.string().url().refine((value) => {
  const protocol = new URL(value).protocol;
  return protocol === "http:" || protocol === "https:";
}, "URL must use http or https");
const optionalUrl = z.union([webUrl, z.literal(""), z.null()]).transform((value) => value || null);
const optionalDate = z.union([z.null(), z.coerce.date()]).optional();

export const createOpportunitySchema = z.object({
  title: z.string().trim().min(1).max(200),
  organization: z.string().trim().max(200).nullable().optional(),
  type: z.enum(opportunityTypes).default("program"),
  status: z.enum(opportunityStatuses).default("saved"),
  priority: z.enum(priorities).default("normal"),
  sourceUrl: optionalUrl.optional(),
  applicationUrl: optionalUrl.optional(),
  description: z.string().trim().max(10000).nullable().optional(),
  notes: z.string().trim().max(20000).nullable().optional(),
  nextAction: z.string().trim().max(500).nullable().optional(),
  location: z.string().trim().max(300).nullable().optional(),
  isRemote: z.boolean().nullable().optional(),
  deadlineAt: optionalDate,
  followUpAt: optionalDate,
});

export const updateOpportunitySchema = createOpportunitySchema.partial().extend({
  appliedAt: optionalDate,
  archivedAt: optionalDate,
});

export const opportunityListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  q: z.string().trim().max(200).optional(),
  status: z.enum(opportunityStatuses).optional(),
  type: z.enum(opportunityTypes).optional(),
  priority: z.enum(priorities).optional(),
  deadlineBefore: z.coerce.date().optional(),
  deadlineAfter: z.coerce.date().optional(),
  sort: z.enum(["deadline", "created", "updated", "title"]).default("deadline"),
  order: z.enum(["asc", "desc"]).default("asc"),
});

export type CreateOpportunityInput = z.infer<typeof createOpportunitySchema>;
export type UpdateOpportunityInput = z.infer<typeof updateOpportunitySchema>;
export type OpportunityListQuery = z.infer<typeof opportunityListQuerySchema>;
