import { api } from "./api";
import { emitDataChanged } from "./events";
import type { Opportunity, OpportunityStatus, Task, TaskStatus } from "./types";

export async function setTaskStatus(id: string, status: TaskStatus): Promise<Task> {
  const task = await api.patch<Task>(`/api/tasks/${id}`, { status });
  emitDataChanged();
  return task;
}

export async function updateTask(id: string, patch: Partial<Task>): Promise<Task> {
  const task = await api.patch<Task>(`/api/tasks/${id}`, patch);
  emitDataChanged();
  return task;
}

export async function setOpportunityStatus(
  id: string,
  status: OpportunityStatus,
  extra: Record<string, unknown> = {},
): Promise<Opportunity> {
  const opp = await api.patch<Opportunity>(`/api/opportunities/${id}`, { status, ...extra });
  emitDataChanged();
  return opp;
}

export async function updateOpportunity(
  id: string,
  patch: Record<string, unknown>,
): Promise<Opportunity> {
  const opp = await api.patch<Opportunity>(`/api/opportunities/${id}`, patch);
  emitDataChanged();
  return opp;
}

export async function deleteOpportunity(id: string): Promise<void> {
  await api.del(`/api/opportunities/${id}`);
  emitDataChanged();
}
