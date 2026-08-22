"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/ui/components/EmptyState";
import { api, buildQuery } from "@/ui/lib/api";
import { openingState, relativeDeadline } from "@/ui/lib/format";
import { useResource } from "@/ui/lib/useResource";
import type { Opportunity } from "@/ui/lib/types";
import styles from "./CalendarView.module.css";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface CalEvent {
  key: string;
  date: Date;
  title: string;
  kind: "deadline" | "followup" | "opening";
  oppId: string;
}

const KIND_LABEL: Record<CalEvent["kind"], string> = {
  deadline: "Deadline",
  opening: "Opens",
  followup: "Follow-up",
};

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function CalendarView() {
  const router = useRouter();
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const { data, loading } = useResource(
    () =>
      api.getList<Opportunity>(
        `/api/opportunities${buildQuery({ limit: 100, sort: "deadline", order: "asc" })}`,
      ),
    [],
  );

  const opps = useMemo(() => data?.data ?? [], [data]);

  const events = useMemo(() => {
    const list: CalEvent[] = [];
    for (const opp of opps) {
      if (opp.openAt) {
        list.push({
          key: `${opp.id}-o`,
          date: new Date(opp.openAt),
          title: opp.title,
          kind: "opening",
          oppId: opp.id,
        });
      }
      if (opp.deadlineAt) {
        list.push({
          key: `${opp.id}-d`,
          date: new Date(opp.deadlineAt),
          title: opp.title,
          kind: "deadline",
          oppId: opp.id,
        });
      }
      if (opp.followUpAt) {
        list.push({
          key: `${opp.id}-f`,
          date: new Date(opp.followUpAt),
          title: opp.title,
          kind: "followup",
          oppId: opp.id,
        });
      }
    }
    return list;
  }, [opps]);

  const eventsByDay = useMemo(() => {
    const map: Record<string, CalEvent[]> = {};
    for (const ev of events) {
      const k = dayKey(ev.date);
      (map[k] ??= []).push(ev);
    }
    return map;
  }, [events]);

  const grid = useMemo(() => {
    const firstDay = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = new Date(firstDay);
    start.setDate(1 - firstDay.getDay());
    const cells: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      cells.push(d);
    }
    return cells;
  }, [cursor]);

  const agenda = useMemo(() => {
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return events
      .filter((e) => e.date >= start)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 12);
  }, [events, today]);

  function shiftMonth(delta: number) {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.mainCol}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Calendar</h1>
            <p className={styles.subtitle}>Deadlines and follow-ups across your opportunities.</p>
          </div>
          <div className={styles.monthNav}>
            <button type="button" className={styles.navBtn} onClick={() => shiftMonth(-1)} aria-label="Previous month">
              ‹
            </button>
            <span className={styles.monthLabel}>
              {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
            </span>
            <button type="button" className={styles.navBtn} onClick={() => shiftMonth(1)} aria-label="Next month">
              ›
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}>
              Today
            </button>
          </div>
        </div>

        <div className="card" style={{ overflow: "hidden" }}>
          <div className={styles.weekRow}>
            {WEEKDAYS.map((w) => (
              <div key={w} className={styles.weekday}>
                {w}
              </div>
            ))}
          </div>
          <div className={styles.grid}>
            {grid.map((d) => {
              const inMonth = d.getMonth() === cursor.getMonth();
              const isToday = dayKey(d) === dayKey(today);
              const dayEvents = eventsByDay[dayKey(d)] ?? [];
              return (
                <div key={dayKey(d)} className={styles.cell} data-out={!inMonth} data-today={isToday}>
                  <div className={styles.cellDay}>{d.getDate()}</div>
                  <div className={styles.cellEvents}>
                    {dayEvents.slice(0, 3).map((ev) => (
                      <button
                        key={ev.key}
                        type="button"
                        className={styles.event}
                        data-kind={ev.kind}
                        onClick={() => router.push(`/opportunities/${ev.oppId}`)}
                        title={`${ev.title} · ${ev.kind === "deadline" ? "Deadline" : "Follow-up"}`}
                      >
                        {ev.title}
                      </button>
                    ))}
                    {dayEvents.length > 3 ? (
                      <span className={styles.more}>+{dayEvents.length - 3} more</span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <aside className={styles.rail}>
        <div className="card" style={{ padding: 16 }}>
          <div className={styles.agendaTitle}>Upcoming</div>
          {loading && agenda.length === 0 ? (
            <div style={{ marginTop: 12 }}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="skeleton" style={{ height: 40, marginBottom: 8 }} />
              ))}
            </div>
          ) : agenda.length === 0 ? (
            <EmptyState title="Nothing scheduled" compact />
          ) : (
            <div className={styles.agenda}>
              {agenda.map((ev) => {
                const iso = ev.date.toISOString();
                const relLabel =
                  ev.kind === "opening" ? openingState(iso).label : relativeDeadline(iso).label;
                return (
                  <button
                    key={ev.key}
                    type="button"
                    className={styles.agendaRow}
                    onClick={() => router.push(`/opportunities/${ev.oppId}`)}
                  >
                    <span className={styles.agendaDot} data-kind={ev.kind} />
                    <span className={styles.agendaBody}>
                      <span className={styles.agendaName}>{ev.title}</span>
                      <span className={styles.agendaMeta}>
                        {KIND_LABEL[ev.kind]} · {relLabel}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={styles.agendaDot} data-kind="opening" /> Opens
          </span>
          <span className={styles.legendItem}>
            <span className={styles.agendaDot} data-kind="deadline" /> Deadline
          </span>
          <span className={styles.legendItem}>
            <span className={styles.agendaDot} data-kind="followup" /> Follow-up
          </span>
        </div>
      </aside>
    </div>
  );
}
