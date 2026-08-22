export type OpportunityStatus =
  | "saved"
  | "need_to_apply"
  | "in_progress"
  | "applied"
  | "waiting"
  | "interview"
  | "accepted"
  | "rejected"
  | "withdrawn"
  | "archived";

export type OpportunityType =
  | "internship"
  | "fellowship"
  | "program"
  | "startup_program"
  | "funding"
  | "competition"
  | "event"
  | "other";

export type Priority = "low" | "normal" | "high" | "urgent";

export type TaskStatus = "todo" | "in_progress" | "done" | "cancelled";

export type TaskKind =
  | "apply"
  | "download"
  | "review"
  | "contact"
  | "attend"
  | "complete"
  | "other";

export interface Opportunity {
  id: string;
  title: string;
  organization: string | null;
  type: OpportunityType;
  status: OpportunityStatus;
  priority: Priority;
  sourceUrl: string | null;
  applicationUrl: string | null;
  description: string | null;
  notes: string | null;
  nextAction: string | null;
  location: string | null;
  isRemote: boolean | null;
  openAt: string | null;
  deadlineAt: string | null;
  followUpAt: string | null;
  appliedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  opportunityId: string | null;
  title: string;
  notes: string | null;
  kind: TaskKind;
  actionUrl: string | null;
  status: TaskStatus;
  priority: Priority;
  dueAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardData {
  generatedAt: string;
  counts: Partial<Record<OpportunityStatus, number>>;
  overdueCount: number;
  needsAttention: Opportunity[];
  overdue: Opportunity[];
  dueSoon: Opportunity[];
  followUps: Opportunity[];
  overdueTasks: Task[];
  upcomingTasks: Task[];
  openingSoon: Opportunity[];
}

export interface ListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
