import type {
  OpportunityStatus,
  OpportunityType,
  Priority,
  TaskKind,
} from "./types";

export const STATUS_LABEL: Record<OpportunityStatus, string> = {
  saved: "Saved",
  need_to_apply: "Need to apply",
  in_progress: "In progress",
  applied: "Applied",
  waiting: "Waiting",
  interview: "Interview",
  accepted: "Accepted",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
  archived: "Archived",
};

export const TYPE_LABEL: Record<OpportunityType, string> = {
  internship: "Internship",
  fellowship: "Fellowship",
  program: "Program",
  startup_program: "Startup program",
  funding: "Funding",
  competition: "Competition",
  event: "Event",
  other: "Other",
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};

export const TASK_KIND_LABEL: Record<TaskKind, string> = {
  apply: "Apply",
  download: "Download",
  review: "Review",
  contact: "Contact",
  attend: "Attend",
  complete: "Complete",
  other: "Task",
};

/** Action-first primary CTA label for an opportunity, based on status. */
export function opportunityActionLabel(status: OpportunityStatus): string {
  switch (status) {
    case "need_to_apply":
      return "Apply";
    case "in_progress":
      return "Continue";
    case "saved":
      return "Review";
    default:
      return "View";
  }
}

const ORG_PALETTE = [
  { bg: "#eef2ff", fg: "#4338ca" },
  { bg: "#ecfdf5", fg: "#047857" },
  { bg: "#f5f3ff", fg: "#6d28d9" },
  { bg: "#eff6ff", fg: "#1d4ed8" },
  { bg: "#fff7ed", fg: "#c2410c" },
  { bg: "#fdf2f8", fg: "#be185d" },
  { bg: "#f0f9ff", fg: "#0369a1" },
  { bg: "#f7fee7", fg: "#4d7c0f" },
  { bg: "#fef2f2", fg: "#b91c1c" },
  { bg: "#f0fdfa", fg: "#0f766e" },
];

export function monogram(name: string | null | undefined, fallback = "•"): string {
  if (!name) return fallback;
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return fallback;
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function orgColor(name: string | null | undefined): { bg: string; fg: string } {
  if (!name) return { bg: "#f2f4f7", fg: "#475467" };
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return ORG_PALETTE[hash % ORG_PALETTE.length];
}

export type DateTone = "overdue" | "soon" | "later" | "none";

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Whole-day difference between a date and now (negative = past). */
export function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) return null;
  const diff = startOfDay(target) - startOfDay(new Date());
  return Math.round(diff / (24 * 60 * 60 * 1000));
}

export function relativeDeadline(iso: string | null | undefined): {
  label: string;
  tone: DateTone;
} {
  const days = daysUntil(iso);
  if (days === null) return { label: "No deadline", tone: "none" };
  if (days < 0) return { label: `Overdue by ${Math.abs(days)}d`, tone: "overdue" };
  if (days === 0) return { label: "Due today", tone: "overdue" };
  if (days === 1) return { label: "Due tomorrow", tone: "overdue" };
  if (days <= 7) return { label: `Due in ${days} days`, tone: "soon" };
  return { label: `Due in ${days} days`, tone: "later" };
}

export function relativeDue(iso: string | null | undefined): {
  label: string;
  tone: DateTone;
} {
  const days = daysUntil(iso);
  if (days === null) return { label: "No due date", tone: "none" };
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, tone: "overdue" };
  if (days === 0) return { label: "Today", tone: "overdue" };
  if (days === 1) return { label: "Tomorrow", tone: "soon" };
  if (days <= 7) return { label: `In ${days} days`, tone: "soon" };
  return { label: formatDate(iso), tone: "later" };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const now = new Date();
  const sameYear = d.getFullYear() === now.getFullYear();
  return sameYear
    ? `${MONTHS[d.getMonth()]} ${d.getDate()}`
    : `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function shortMonth(iso: string | null | undefined): { mon: string; day: string } {
  if (!iso) return { mon: "—", day: "" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { mon: "—", day: "" };
  return { mon: MONTHS[d.getMonth()].toUpperCase(), day: String(d.getDate()) };
}

/** Choose the best external link to open for an opportunity. */
export function openLinkFor(opp: {
  applicationUrl: string | null;
  sourceUrl: string | null;
}): string | null {
  return opp.applicationUrl || opp.sourceUrl || null;
}
