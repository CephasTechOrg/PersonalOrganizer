"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/ui/components/EmptyState";
import { Monogram } from "@/ui/components/Monogram";
import { ExternalIcon } from "@/ui/components/icons";
import { api } from "@/ui/lib/api";
import {
  STATUS_LABEL,
  TYPE_LABEL,
  formatDate,
  openLinkFor,
  openingState,
  opportunityActionLabel,
  relativeDeadline,
  relativeDue,
  shortMonth,
} from "@/ui/lib/format";
import { setOpportunityStatus, setTaskStatus } from "@/ui/lib/mutations";
import { useResource } from "@/ui/lib/useResource";
import type { DashboardData, Opportunity, Task } from "@/ui/lib/types";
import { useOwnerFirstName } from "@/ui/shell/OwnerContext";
import { useQuickAdd } from "@/ui/shell/QuickAddProvider";
import { useToast } from "@/ui/shell/ToastProvider";
import styles from "./HomeView.module.css";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const PIPELINE = [
  { key: "need_to_apply", label: "Need to apply", color: "#2563eb" },
  { key: "in_progress", label: "In progress", color: "#6941c6" },
  { key: "applied", label: "Applied", color: "#12b76a" },
  { key: "waiting", label: "Waiting", color: "#f79009" },
  { key: "accepted", label: "Accepted", color: "#0e9384" },
] as const;

export function HomeView() {
  const firstName = useOwnerFirstName();
  const quickAdd = useQuickAdd();
  const { data, loading, error, reload } = useResource<DashboardData>(
    () => api.get<DashboardData>("/api/dashboard"),
    [],
  );

  if (loading && !data) return <HomeSkeleton />;

  if (error && !data) {
    return (
      <EmptyState
        title="Couldn't load your dashboard"
        description={error}
        action={
          <button type="button" className="btn btn-secondary" onClick={reload}>
            Try again
          </button>
        }
      />
    );
  }

  const dash = data as DashboardData;
  const counts = dash.counts;
  const totalTracked = Object.values(counts).reduce((sum, n) => sum + (n ?? 0), 0);

  const attentionCount = dash.needsAttention.length;
  const openingCount = dash.openingSoon?.length ?? 0;
  const openTaskCount = [...dash.overdueTasks, ...dash.upcomingTasks].length;

  const subtitle =
    attentionCount > 0
      ? `${attentionCount} item${attentionCount === 1 ? "" : "s"} need attention right now.`
      : openingCount > 0
        ? `You're caught up. ${openingCount} opening soon.`
        : "You're caught up — nothing urgent today.";

  const summary = [
    {
      label: "Need to apply",
      value: counts.need_to_apply ?? 0,
      meta: dash.overdueCount > 0 ? `${dash.overdueCount} overdue` : "Ready to start",
      tone: dash.overdueCount > 0 ? "overdue" : "muted",
      dot: "#2563eb",
      href: "/opportunities?status=need_to_apply",
    },
    {
      label: "In progress",
      value: counts.in_progress ?? 0,
      meta: "Being worked on",
      tone: "muted",
      dot: "#6941c6",
      href: "/opportunities?status=in_progress",
    },
    {
      label: "Applied / waiting",
      value: (counts.applied ?? 0) + (counts.waiting ?? 0) + (counts.interview ?? 0),
      meta: "In the pipeline",
      tone: "muted",
      dot: "#12b76a",
      href: "/opportunities?status=applied",
    },
    {
      label: "Due this week",
      value: dash.dueSoon.length,
      meta: openingCount > 0 ? `${openingCount} opening soon` : "Upcoming deadlines",
      tone: dash.dueSoon.length > 0 ? "soon" : "muted",
      dot: "#98a2b3",
      href: "/opportunities?sort=deadline&order=asc",
    },
  ] as const;

  return (
    <div className={styles.page}>
      <div className={styles.mainCol}>
        <header className={styles.hero}>
          <div className={styles.heroText}>
            <p className={styles.eyebrow}>Your private hub</p>
            <h1 className={styles.greeting}>
              {greeting()}, {firstName}
            </h1>
            <p className={styles.subtitle}>{subtitle}</p>
          </div>
          <div className={styles.heroActions}>
            <button type="button" className="btn btn-primary" onClick={() => quickAdd.open("opportunity")}>
              + Add opportunity
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => quickAdd.open("task")}>
              + Add task
            </button>
          </div>
        </header>

        <div className={styles.summary}>
          {summary.map((s) => (
            <Link key={s.label} href={s.href} className={styles.stat}>
              <div className={styles.statLabel}>
                <span className={styles.statDot} style={{ background: s.dot }} />
                {s.label}
              </div>
              <div className={styles.statValue}>{s.value}</div>
              <div className={styles.statMeta} data-tone={s.tone}>
                {s.meta}
              </div>
            </Link>
          ))}
        </div>

        <section>
          <div className={styles.sectionHead}>
            <div className={styles.sectionTitleRow}>
              <span className={styles.sectionTitle}>Needs attention</span>
              {attentionCount > 0 ? (
                <span className={styles.attentionCount}>{attentionCount}</span>
              ) : null}
            </div>
            <Link href="/opportunities" className={styles.viewAll}>
              View all
            </Link>
          </div>

          <div className={`card ${styles.listCard}`}>
            {attentionCount === 0 ? (
              <EmptyState
                title="You're caught up"
                description="No applications need your attention right now."
                action={
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => quickAdd.open("opportunity")}>
                    Add opportunity
                  </button>
                }
              />
            ) : (
              dash.needsAttention.map((opp) => <AttentionRow key={opp.id} opp={opp} />)
            )}
          </div>
        </section>

        {totalTracked > 0 ? (
          <section className={`card ${styles.pipelineCard}`}>
            <div className={styles.sectionHead} style={{ margin: 0 }}>
              <span className={styles.railTitle}>Pipeline</span>
              <span className={styles.pipelineTotal}>{totalTracked} tracked</span>
            </div>
            <div className={styles.pipeline}>
              {PIPELINE.map((p) => {
                const value =
                  p.key === "accepted"
                    ? (counts.accepted ?? 0) + (counts.interview ?? 0)
                    : counts[p.key] ?? 0;
                const pct = totalTracked ? Math.round((value / totalTracked) * 100) : 0;
                return (
                  <Link
                    key={p.key}
                    href={`/opportunities?status=${p.key === "accepted" ? "accepted" : p.key}`}
                    className={styles.pipelineSeg}
                    style={{ flex: Math.max(value, 1) }}
                  >
                    <div className={styles.pipelineBar} style={{ background: p.color }} />
                    <div className={styles.pipelineLabel}>{p.label}</div>
                    <div className={styles.pipelineValue}>
                      {value} · {pct}%
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>

      <aside className={styles.rail}>
        <DeadlinesCard opportunities={dash.dueSoon} />
        {openingCount > 0 ? <OpeningSoonCard opportunities={dash.openingSoon} /> : null}
        {dash.followUps.length > 0 ? <FollowUpsCard opportunities={dash.followUps} /> : null}
        <TasksCard
          tasks={[...dash.overdueTasks, ...dash.upcomingTasks]}
          openCount={openTaskCount}
          onAdd={() => quickAdd.open("task")}
        />
      </aside>
    </div>
  );
}

function AttentionRow({ opp }: { opp: Opportunity }) {
  const router = useRouter();
  const toast = useToast();
  const rel = relativeDeadline(opp.deadlineAt);
  const link = openLinkFor(opp);
  const actionLabel = opportunityActionLabel(opp.status);
  const isApply = opp.status === "need_to_apply" && !!link;

  function onAction() {
    if (isApply && link) {
      window.open(link, "_blank", "noopener,noreferrer");
      setOpportunityStatus(opp.id, "applied").then(
        () => toast.success("Marked as applied."),
        () => toast.error("Opened link, but couldn't update status."),
      );
    } else {
      router.push(`/opportunities/${opp.id}`);
    }
  }

  return (
    <div className={styles.attentionRow} data-tone={rel.tone}>
      <Monogram name={opp.organization ?? opp.title} size={36} />
      <div className={styles.attentionBody}>
        <Link href={`/opportunities/${opp.id}`} className={styles.attentionTitle}>
          {opp.title}
        </Link>
        <div className={styles.attentionMeta}>
          {opp.organization ? `${opp.organization} · ` : ""}
          {TYPE_LABEL[opp.type]} ·{" "}
          <span data-tone={rel.tone} className={styles.relText}>
            {rel.label}
          </span>
        </div>
      </div>
      <button
        type="button"
        className={`btn ${isApply ? "btn-primary" : "btn-secondary"} btn-sm ${styles.rowAction}`}
        onClick={onAction}
      >
        {isApply ? (
          <>
            {actionLabel}
            <ExternalIcon width={14} height={14} />
          </>
        ) : (
          "View"
        )}
      </button>
    </div>
  );
}

function DeadlinesCard({ opportunities }: { opportunities: Opportunity[] }) {
  return (
    <div className={`card ${styles.railCard}`}>
      <div className={styles.railHead}>
        <span className={styles.railTitle}>Upcoming deadlines</span>
        <Link href="/opportunities?sort=deadline&order=asc" className={styles.viewAll}>
          View all
        </Link>
      </div>
      {opportunities.length === 0 ? (
        <EmptyState title="Nothing due soon" compact />
      ) : (
        opportunities.slice(0, 5).map((opp) => {
          const { mon, day } = shortMonth(opp.deadlineAt);
          const rel = relativeDeadline(opp.deadlineAt);
          return (
            <Link key={opp.id} href={`/opportunities/${opp.id}`} className={styles.deadlineRow}>
              <div className={styles.deadlineDate}>
                <div className={styles.deadlineMon}>{mon}</div>
                <div className={styles.deadlineDay}>{day}</div>
              </div>
              <div className={styles.deadlineBody}>
                <div className={styles.deadlineTitle}>{opp.title}</div>
                <div className={styles.deadlineOrg}>{opp.organization ?? TYPE_LABEL[opp.type]}</div>
                <span className="chip" data-tone={rel.tone} style={{ marginTop: 5 }}>
                  {rel.label}
                </span>
              </div>
            </Link>
          );
        })
      )}
    </div>
  );
}

function OpeningSoonCard({ opportunities }: { opportunities: Opportunity[] }) {
  return (
    <div className={`card ${styles.railCard}`}>
      <div className={styles.railHead}>
        <span className={styles.railTitle}>Opening soon</span>
        <Link href="/opportunities?status=upcoming" className={styles.viewAll}>
          View all
        </Link>
      </div>
      {opportunities.slice(0, 5).map((opp) => {
        const { mon, day } = shortMonth(opp.openAt);
        const opening = openingState(opp.openAt);
        return (
          <Link key={opp.id} href={`/opportunities/${opp.id}`} className={styles.deadlineRow}>
            <div className={styles.deadlineDate}>
              <div className={styles.deadlineMon}>{mon}</div>
              <div className={styles.deadlineDay}>{day}</div>
            </div>
            <div className={styles.deadlineBody}>
              <div className={styles.deadlineTitle}>{opp.title}</div>
              <div className={styles.deadlineOrg}>{opp.organization ?? TYPE_LABEL[opp.type]}</div>
              <span className="chip" data-tone={opening.tone} style={{ marginTop: 5 }}>
                {opening.label}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function FollowUpsCard({ opportunities }: { opportunities: Opportunity[] }) {
  return (
    <div className={`card ${styles.railCard}`}>
      <div className={styles.railHead}>
        <span className={styles.railTitle}>Follow-ups due</span>
      </div>
      {opportunities.slice(0, 5).map((opp) => (
        <Link key={opp.id} href={`/opportunities/${opp.id}`} className={styles.followRow}>
          <Monogram name={opp.organization ?? opp.title} size={30} />
          <div className={styles.deadlineBody}>
            <div className={styles.deadlineTitle}>{opp.title}</div>
            <div className={styles.deadlineOrg}>
              {STATUS_LABEL[opp.status]} · follow up {formatDate(opp.followUpAt)}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function TasksCard({
  tasks,
  openCount,
  onAdd,
}: {
  tasks: Task[];
  openCount: number;
  onAdd: () => void;
}) {
  const toast = useToast();
  const [pending, setPending] = useState<Record<string, boolean>>({});

  async function complete(task: Task) {
    setPending((p) => ({ ...p, [task.id]: true }));
    try {
      await setTaskStatus(task.id, "done");
      toast.success("Task completed.");
    } catch {
      toast.error("Couldn't update task.");
      setPending((p) => ({ ...p, [task.id]: false }));
    }
  }

  const visible = tasks.slice(0, 5);

  return (
    <div className={`card ${styles.railCard}`}>
      <div className={styles.railHead}>
        <span className={styles.railTitle}>
          Tasks{openCount > 0 ? <span className={styles.softCount}>{openCount}</span> : null}
        </span>
        <Link href="/tasks" className={styles.viewAll}>
          View all
        </Link>
      </div>
      {visible.length === 0 ? (
        <EmptyState title="No open tasks" compact />
      ) : (
        visible.map((task) => {
          const due = relativeDue(task.dueAt);
          const done = task.status === "done" || pending[task.id];
          return (
            <div key={task.id} className={styles.taskRow}>
              <button
                type="button"
                className={styles.checkbox}
                data-done={done}
                onClick={() => !done && complete(task)}
                aria-label="Complete task"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: done ? 1 : 0 }}>
                  <path d="m5 12.5 4.5 4.5L19 7" />
                </svg>
              </button>
              <div className={styles.deadlineBody}>
                <div className={styles.taskTitle} data-done={done}>
                  {task.title}
                </div>
              </div>
              <span className={styles.taskDue} data-tone={due.tone}>
                {due.label}
              </span>
            </div>
          );
        })
      )}
      <button type="button" className={styles.addTask} onClick={onAdd}>
        + Add task
      </button>
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div className={styles.page}>
      <div className={styles.mainCol}>
        <div className="skeleton" style={{ height: 30, width: 280 }} />
        <div className={styles.summary}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={styles.stat}>
              <div className="skeleton" style={{ height: 12, width: 80 }} />
              <div className="skeleton" style={{ height: 22, width: 40, marginTop: 12 }} />
              <div className="skeleton" style={{ height: 10, width: 60, marginTop: 8 }} />
            </div>
          ))}
        </div>
        <div className="card" style={{ padding: 18 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton" style={{ height: 46, marginBottom: 10 }} />
          ))}
        </div>
      </div>
      <aside className={styles.rail}>
        <div className="card skeleton" style={{ height: 220 }} />
        <div className="card skeleton" style={{ height: 180 }} />
      </aside>
    </div>
  );
}
