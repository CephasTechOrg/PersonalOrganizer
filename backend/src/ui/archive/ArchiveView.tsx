"use client";

import { useState } from "react";
import Link from "next/link";
import { EmptyState } from "@/ui/components/EmptyState";
import { Monogram } from "@/ui/components/Monogram";
import { api, buildQuery } from "@/ui/lib/api";
import { STATUS_LABEL, TASK_KIND_LABEL, formatDate } from "@/ui/lib/format";
import { setOpportunityStatus, setTaskStatus } from "@/ui/lib/mutations";
import { useResource } from "@/ui/lib/useResource";
import type { Opportunity, Task } from "@/ui/lib/types";
import { useToast } from "@/ui/shell/ToastProvider";
import styles from "./ArchiveView.module.css";

type TabKey = "opportunities" | "tasks";

export function ArchiveView() {
  const [tab, setTab] = useState<TabKey>("opportunities");

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Archive</h1>
      <p className={styles.subtitle}>Closed opportunities and completed work, kept for reference.</p>

      <div className={styles.tabs}>
        <button
          type="button"
          className={styles.tab}
          data-active={tab === "opportunities"}
          onClick={() => setTab("opportunities")}
        >
          Opportunities
        </button>
        <button
          type="button"
          className={styles.tab}
          data-active={tab === "tasks"}
          onClick={() => setTab("tasks")}
        >
          Completed tasks
        </button>
      </div>

      <div className="card">
        {tab === "opportunities" ? <ArchivedOpportunities /> : <CompletedTasks />}
      </div>
    </div>
  );
}

function ArchivedOpportunities() {
  const toast = useToast();
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const { data, loading, error, reload } = useResource(
    () =>
      api.getList<Opportunity>(
        `/api/opportunities${buildQuery({ status: "archived", limit: 100, sort: "updated", order: "desc" })}`,
      ),
    [],
  );

  async function restore(opp: Opportunity) {
    setBusy((b) => ({ ...b, [opp.id]: true }));
    try {
      await setOpportunityStatus(opp.id, "saved");
      toast.success("Restored to Saved.");
    } catch {
      toast.error("Couldn't restore.");
      setBusy((b) => ({ ...b, [opp.id]: false }));
    }
  }

  const rows = data?.data ?? [];

  if (error) {
    return (
      <EmptyState
        title="Couldn't load archive"
        description={error}
        action={
          <button type="button" className="btn btn-secondary" onClick={reload}>
            Try again
          </button>
        }
      />
    );
  }

  if (loading && rows.length === 0) {
    return (
      <div>
        {[0, 1, 2].map((i) => (
          <div key={i} className={styles.row}>
            <div className="skeleton" style={{ width: 34, height: 34, borderRadius: 9 }} />
            <div className="skeleton" style={{ height: 13, width: "40%" }} />
          </div>
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return <EmptyState title="No archived opportunities" description="Archived opportunities will appear here." />;
  }

  return (
    <div>
      {rows.map((opp) => (
        <div key={opp.id} className={styles.row}>
          <Monogram name={opp.organization ?? opp.title} size={34} />
          <div className={styles.body}>
            <Link href={`/opportunities/${opp.id}`} className={styles.rowTitle}>
              {opp.title}
            </Link>
            <div className={styles.meta}>
              {opp.organization ? `${opp.organization} · ` : ""}archived {formatDate(opp.archivedAt ?? opp.updatedAt)}
            </div>
          </div>
          <span className="chip" data-status={opp.status}>
            {STATUS_LABEL[opp.status]}
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={busy[opp.id]}
            onClick={() => restore(opp)}
          >
            Restore
          </button>
        </div>
      ))}
    </div>
  );
}

function CompletedTasks() {
  const toast = useToast();
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const { data, loading, error, reload } = useResource(
    () =>
      api.getList<Task>(
        `/api/tasks${buildQuery({ status: "done", limit: 100, sort: "updated", order: "desc" })}`,
      ),
    [],
  );

  async function reopen(task: Task) {
    setBusy((b) => ({ ...b, [task.id]: true }));
    try {
      await setTaskStatus(task.id, "todo");
      toast.success("Task reopened.");
    } catch {
      toast.error("Couldn't reopen task.");
      setBusy((b) => ({ ...b, [task.id]: false }));
    }
  }

  const rows = data?.data ?? [];

  if (error) {
    return (
      <EmptyState
        title="Couldn't load tasks"
        description={error}
        action={
          <button type="button" className="btn btn-secondary" onClick={reload}>
            Try again
          </button>
        }
      />
    );
  }

  if (loading && rows.length === 0) {
    return (
      <div>
        {[0, 1, 2].map((i) => (
          <div key={i} className={styles.row}>
            <div className="skeleton" style={{ height: 13, width: "40%" }} />
          </div>
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return <EmptyState title="No completed tasks" description="Completed tasks will appear here." />;
  }

  return (
    <div>
      {rows.map((task) => (
        <div key={task.id} className={styles.row}>
          <span className={styles.checkDone} aria-hidden="true">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="m5 12.5 4.5 4.5L19 7" />
            </svg>
          </span>
          <div className={styles.body}>
            <div className={styles.rowTitleDone}>{task.title}</div>
            <div className={styles.meta}>Completed {formatDate(task.completedAt ?? task.updatedAt)}</div>
          </div>
          <span className="chip">{TASK_KIND_LABEL[task.kind]}</span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={busy[task.id]}
            onClick={() => reopen(task)}
          >
            Reopen
          </button>
        </div>
      ))}
    </div>
  );
}
