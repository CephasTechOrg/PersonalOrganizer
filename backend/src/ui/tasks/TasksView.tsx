"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/ui/components/EmptyState";
import { ExternalIcon } from "@/ui/components/icons";
import { api, buildQuery } from "@/ui/lib/api";
import { TASK_KIND_LABEL, daysUntil, relativeDue } from "@/ui/lib/format";
import { setTaskStatus } from "@/ui/lib/mutations";
import { useResource } from "@/ui/lib/useResource";
import type { Task, TaskKind } from "@/ui/lib/types";
import { useQuickAdd } from "@/ui/shell/QuickAddProvider";
import { useToast } from "@/ui/shell/ToastProvider";
import styles from "./TasksView.module.css";

type TabKey = "today" | "upcoming" | "overdue" | "completed" | "all";

const TABS: { key: TabKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "upcoming", label: "Upcoming" },
  { key: "overdue", label: "Overdue" },
  { key: "completed", label: "Completed" },
  { key: "all", label: "All" },
];

const KINDS = Object.keys(TASK_KIND_LABEL) as TaskKind[];

function isActive(t: Task): boolean {
  return t.status === "todo" || t.status === "in_progress";
}

function inTab(task: Task, tab: TabKey): boolean {
  const days = daysUntil(task.dueAt);
  switch (tab) {
    case "completed":
      return task.status === "done";
    case "overdue":
      return isActive(task) && days !== null && days < 0;
    case "today":
      return isActive(task) && days === 0;
    case "upcoming":
      return isActive(task) && (days === null || days > 0);
    case "all":
      return task.status !== "cancelled";
  }
}

export function TasksView() {
  const router = useRouter();
  const toast = useToast();
  const quickAdd = useQuickAdd();
  const [tab, setTab] = useState<TabKey>("today");
  const [scope, setScope] = useState<"all" | "personal" | "linked">("all");
  const [kind, setKind] = useState<TaskKind | "">("");
  const [pending, setPending] = useState<Record<string, boolean>>({});

  const { data, loading, error, reload } = useResource(
    () =>
      api.getList<Task>(
        `/api/tasks${buildQuery({ limit: 100, sort: "due", order: "asc" })}`,
      ),
    [],
  );

  const allTasks = useMemo(() => data?.data ?? [], [data]);

  const scoped = useMemo(
    () =>
      allTasks.filter((t) => {
        if (scope === "personal" && t.opportunityId) return false;
        if (scope === "linked" && !t.opportunityId) return false;
        if (kind && t.kind !== kind) return false;
        return true;
      }),
    [allTasks, scope, kind],
  );

  const counts = useMemo(() => {
    const c: Record<TabKey, number> = { today: 0, upcoming: 0, overdue: 0, completed: 0, all: 0 };
    for (const t of scoped) {
      for (const tk of TABS) if (inTab(t, tk.key)) c[tk.key] += 1;
    }
    return c;
  }, [scoped]);

  const rows = useMemo(() => scoped.filter((t) => inTab(t, tab)), [scoped, tab]);

  async function toggle(task: Task) {
    const done = task.status === "done";
    setPending((p) => ({ ...p, [task.id]: true }));
    try {
      await setTaskStatus(task.id, done ? "todo" : "done");
      if (!done) toast.success("Task completed.");
    } catch {
      toast.error("Couldn't update task.");
    } finally {
      setPending((p) => ({ ...p, [task.id]: false }));
    }
  }

  function action(task: Task) {
    if (task.actionUrl) {
      window.open(task.actionUrl, "_blank", "noopener,noreferrer");
    } else if (task.opportunityId) {
      router.push(`/opportunities/${task.opportunityId}`);
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Tasks</h1>
          <p className={styles.subtitle}>
            Everything you need to complete, from applications to personal work.
          </p>
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => quickAdd.open("task")}>
          + Add task
        </button>
      </div>

      <div className={styles.controls}>
        <div className={styles.tabs}>
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={styles.tab}
              data-active={tab === t.key}
              onClick={() => setTab(t.key)}
            >
              {t.label}
              <span className={styles.count}>{counts[t.key]}</span>
            </button>
          ))}
        </div>
        <div className={styles.filters}>
          <select className={styles.select} value={scope} onChange={(e) => setScope(e.target.value as typeof scope)}>
            <option value="all">All tasks</option>
            <option value="linked">Linked to opportunity</option>
            <option value="personal">Personal only</option>
          </select>
          <select className={styles.select} value={kind} onChange={(e) => setKind(e.target.value as TaskKind | "")}>
            <option value="">All types</option>
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {TASK_KIND_LABEL[k]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        {error ? (
          <EmptyState
            title="Couldn't load tasks"
            description={error}
            action={
              <button type="button" className="btn btn-secondary" onClick={reload}>
                Try again
              </button>
            }
          />
        ) : loading && allTasks.length === 0 ? (
          <div>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={styles.row}>
                <div className="skeleton" style={{ width: 18, height: 18, borderRadius: 5 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: 13, width: "50%" }} />
                </div>
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            title={tab === "completed" ? "Nothing completed yet" : "Nothing here"}
            description={tab === "today" ? "No tasks due today. Nice work." : "No tasks in this view."}
            action={
              <button type="button" className="btn btn-primary" onClick={() => quickAdd.open("task")}>
                + Add task
              </button>
            }
          />
        ) : (
          rows.map((task) => {
            const done = task.status === "done";
            const optimisticDone = done || (pending[task.id] && task.status !== "done");
            const due = relativeDue(task.dueAt);
            const hasAction = !!task.actionUrl || !!task.opportunityId;
            return (
              <div key={task.id} className={styles.row}>
                <button
                  type="button"
                  className={styles.checkbox}
                  data-done={done}
                  onClick={() => toggle(task)}
                  aria-label="Toggle task"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: optimisticDone ? 1 : 0 }}>
                    <path d="m5 12.5 4.5 4.5L19 7" />
                  </svg>
                </button>
                <div className={styles.body}>
                  <div className={styles.taskTitle} data-done={done}>
                    {task.title}
                  </div>
                  <div className={styles.context}>
                    {task.opportunityId ? "Linked opportunity" : "Personal"}
                  </div>
                </div>
                <span className="chip">{TASK_KIND_LABEL[task.kind]}</span>
                <span className={styles.due} data-tone={done ? "none" : due.tone}>
                  {done ? "Done" : due.label}
                </span>
                {hasAction ? (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => action(task)}>
                    {task.actionUrl ? (
                      <>
                        Open
                        <ExternalIcon width={13} height={13} />
                      </>
                    ) : (
                      "Opportunity"
                    )}
                  </button>
                ) : (
                  <span className={styles.actionSpacer} />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
