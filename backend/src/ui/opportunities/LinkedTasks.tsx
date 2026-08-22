"use client";

import { useState } from "react";
import { api, buildQuery } from "@/ui/lib/api";
import { relativeDue, TASK_KIND_LABEL } from "@/ui/lib/format";
import { setTaskStatus } from "@/ui/lib/mutations";
import { useResource } from "@/ui/lib/useResource";
import type { Task } from "@/ui/lib/types";
import { useQuickAdd } from "@/ui/shell/QuickAddProvider";
import { useToast } from "@/ui/shell/ToastProvider";
import { ExternalIcon } from "@/ui/components/icons";
import styles from "./LinkedTasks.module.css";

interface LinkedTasksProps {
  opportunityId: string;
  opportunityTitle: string;
}

export function LinkedTasks({ opportunityId, opportunityTitle }: LinkedTasksProps) {
  const quickAdd = useQuickAdd();
  const toast = useToast();
  const [pending, setPending] = useState<Record<string, boolean>>({});

  const { data, loading } = useResource<Task[]>(
    () =>
      api
        .getList<Task>(`/api/tasks${buildQuery({ opportunityId, limit: 100, sort: "due", order: "asc" })}`)
        .then((r) => r.data),
    [opportunityId],
  );

  async function toggle(task: Task) {
    const done = task.status === "done";
    setPending((p) => ({ ...p, [task.id]: true }));
    try {
      await setTaskStatus(task.id, done ? "todo" : "done");
    } catch {
      toast.error("Couldn't update task.");
    } finally {
      setPending((p) => ({ ...p, [task.id]: false }));
    }
  }

  const tasks = data ?? [];
  const completed = tasks.filter((t) => t.status === "done").length;

  return (
    <div>
      <div className={styles.head}>
        <span className={styles.title}>Tasks</span>
        {tasks.length > 0 ? (
          <span className={styles.count}>
            {completed} / {tasks.length} done
          </span>
        ) : null}
      </div>

      {loading && tasks.length === 0 ? (
        <div className={styles.list}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton" style={{ height: 20, margin: "10px 0" }} />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <p className={styles.empty}>No tasks yet.</p>
      ) : (
        <div className={styles.list}>
          {tasks.map((task) => {
            const done = task.status === "done" || pending[task.id];
            const due = relativeDue(task.dueAt);
            return (
              <div key={task.id} className={styles.row}>
                <button
                  type="button"
                  className={styles.checkbox}
                  data-done={task.status === "done"}
                  onClick={() => toggle(task)}
                  aria-label="Toggle task"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: done ? 1 : 0 }}>
                    <path d="m5 12.5 4.5 4.5L19 7" />
                  </svg>
                </button>
                <span className={styles.taskTitle} data-done={task.status === "done"}>
                  {task.title}
                </span>
                {task.actionUrl ? (
                  <a
                    className={styles.action}
                    href={task.actionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={TASK_KIND_LABEL[task.kind]}
                  >
                    <ExternalIcon width={14} height={14} />
                  </a>
                ) : null}
                <span className={styles.due} data-tone={due.tone}>
                  {due.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <button
        type="button"
        className={styles.addTask}
        onClick={() => quickAdd.open("task", { opportunityId, opportunityTitle })}
      >
        + Add task
      </button>
    </div>
  );
}
