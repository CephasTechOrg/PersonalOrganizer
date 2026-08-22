"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EmptyState } from "@/ui/components/EmptyState";
import { Monogram } from "@/ui/components/Monogram";
import { SearchIcon } from "@/ui/components/icons";
import { api, buildQuery } from "@/ui/lib/api";
import {
  PRIORITY_LABEL,
  STATUS_LABEL,
  TYPE_LABEL,
  formatDate,
  relativeDeadline,
} from "@/ui/lib/format";
import { useResource } from "@/ui/lib/useResource";
import { useIsMobile } from "@/ui/lib/useMediaQuery";
import type {
  ListMeta,
  Opportunity,
  OpportunityStatus,
  OpportunityType,
  Priority,
} from "@/ui/lib/types";
import { useQuickAdd } from "@/ui/shell/QuickAddProvider";
import { OpportunityPanel } from "./OpportunityPanel";
import styles from "./OpportunitiesView.module.css";

const TABS: { key: string; label: string; status?: OpportunityStatus }[] = [
  { key: "all", label: "All" },
  { key: "need_to_apply", label: "Need to apply", status: "need_to_apply" },
  { key: "in_progress", label: "In progress", status: "in_progress" },
  { key: "applied", label: "Applied", status: "applied" },
  { key: "waiting", label: "Waiting", status: "waiting" },
  { key: "interview", label: "Interview", status: "interview" },
  { key: "accepted", label: "Accepted", status: "accepted" },
  { key: "rejected", label: "Rejected", status: "rejected" },
  { key: "archived", label: "Archived", status: "archived" },
];

const TYPES = Object.keys(TYPE_LABEL) as OpportunityType[];
const PRIORITIES: Priority[] = ["urgent", "high", "normal", "low"];
const PAGE_LIMIT = 25;

function deadlineWindow(due: string | null): { deadlineBefore?: string; deadlineAfter?: string } {
  if (!due) return {};
  const now = new Date();
  const iso = (d: Date) => d.toISOString();
  if (due === "overdue") return { deadlineBefore: iso(now) };
  if (due === "week")
    return { deadlineAfter: iso(now), deadlineBefore: iso(new Date(now.getTime() + 7 * 864e5)) };
  if (due === "month")
    return { deadlineAfter: iso(now), deadlineBefore: iso(new Date(now.getTime() + 30 * 864e5)) };
  return {};
}

export function OpportunitiesView() {
  const router = useRouter();
  const params = useSearchParams();
  const isMobile = useIsMobile();
  const quickAdd = useQuickAdd();

  const status = params.get("status") || "all";
  const q = params.get("q") || "";
  const type = params.get("type") || "";
  const priority = params.get("priority") || "";
  const due = params.get("due") || "";
  const sort = params.get("sort") || "deadline";
  const order = params.get("order") || "asc";
  const page = Math.max(1, parseInt(params.get("page") || "1", 10) || 1);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(q);

  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  const setParams = useCallback(
    (patch: Record<string, string | null>, resetPage = true) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === "") next.delete(key);
        else next.set(key, value);
      }
      if (resetPage && !("page" in patch)) next.delete("page");
      router.replace(`/opportunities${next.toString() ? `?${next.toString()}` : ""}`, {
        scroll: false,
      });
    },
    [params, router],
  );

  // Debounced search -> URL
  useEffect(() => {
    if (searchInput === q) return;
    const t = setTimeout(() => setParams({ q: searchInput || null }), 350);
    return () => clearTimeout(t);
  }, [searchInput, q, setParams]);

  const queryString = useMemo(() => {
    const win = deadlineWindow(due);
    return buildQuery({
      page,
      limit: PAGE_LIMIT,
      q: q || undefined,
      status: status === "all" ? undefined : status,
      type: type || undefined,
      priority: priority || undefined,
      sort,
      order,
      ...win,
    });
  }, [page, q, status, type, priority, due, sort, order]);

  const { data, loading, error, reload } = useResource(
    () => api.getList<Opportunity>(`/api/opportunities${queryString}`),
    [queryString],
  );

  const rows = data?.data ?? [];
  const meta: ListMeta | undefined = data?.meta;

  const selected = useMemo(
    () => rows.find((r) => r.id === selectedId) ?? null,
    [rows, selectedId],
  );

  function onRowClick(opp: Opportunity) {
    if (isMobile) {
      router.push(`/opportunities/${opp.id}`);
    } else {
      setSelectedId((cur) => (cur === opp.id ? null : opp.id));
    }
  }

  const hasFilters = q || type || priority || due || status !== "all";

  return (
    <div className={styles.wrap}>
      <div className={styles.mainCol}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Opportunities</h1>
            <p className={styles.subtitle}>
              Track applications, programs, funding, internships, and events.
            </p>
          </div>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => quickAdd.open("opportunity")}>
            + Add
          </button>
        </div>

        <div className={styles.tabs}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={styles.tab}
              data-active={status === tab.key}
              onClick={() => setParams({ status: tab.key === "all" ? null : tab.key })}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className={styles.toolbar}>
          <div className={styles.search}>
            <SearchIcon width={15} height={15} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder="Search opportunities"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <select
            className={styles.select}
            value={type}
            onChange={(e) => setParams({ type: e.target.value || null })}
          >
            <option value="">All types</option>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABEL[t]}
              </option>
            ))}
          </select>
          <select
            className={styles.select}
            value={priority}
            onChange={(e) => setParams({ priority: e.target.value || null })}
          >
            <option value="">Any priority</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABEL[p]}
              </option>
            ))}
          </select>
          <select
            className={styles.select}
            value={due}
            onChange={(e) => setParams({ due: e.target.value || null })}
          >
            <option value="">Any deadline</option>
            <option value="overdue">Overdue</option>
            <option value="week">This week</option>
            <option value="month">This month</option>
          </select>
          <select
            className={styles.select}
            value={`${sort}:${order}`}
            onChange={(e) => {
              const [s, o] = e.target.value.split(":");
              setParams({ sort: s, order: o });
            }}
          >
            <option value="deadline:asc">Deadline soonest</option>
            <option value="created:desc">Recently added</option>
            <option value="updated:desc">Recently updated</option>
            <option value="title:asc">Title A–Z</option>
          </select>
          {hasFilters ? (
            <button
              type="button"
              className={styles.reset}
              onClick={() => router.replace("/opportunities", { scroll: false })}
            >
              Reset
            </button>
          ) : null}
        </div>

        {error ? (
          <div className="card">
            <EmptyState
              title="Couldn't load opportunities"
              description={error}
              action={
                <button type="button" className="btn btn-secondary" onClick={reload}>
                  Try again
                </button>
              }
            />
          </div>
        ) : (
          <div className="card">
            {!isMobile ? (
              <div className={styles.tableHead}>
                <div>Opportunity</div>
                <div>Organization</div>
                <div>Type</div>
                <div>Deadline</div>
                <div>Status</div>
                <div>Priority</div>
              </div>
            ) : null}

            {loading && rows.length === 0 ? (
              <TableSkeleton mobile={isMobile} />
            ) : rows.length === 0 ? (
              <EmptyState
                title="No opportunities found"
                description={hasFilters ? "No opportunities match these filters." : "Add your first opportunity to get started."}
                action={
                  hasFilters ? (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => router.replace("/opportunities", { scroll: false })}
                    >
                      Reset filters
                    </button>
                  ) : (
                    <button type="button" className="btn btn-primary" onClick={() => quickAdd.open("opportunity")}>
                      + Add opportunity
                    </button>
                  )
                }
              />
            ) : isMobile ? (
              <div>
                {rows.map((opp) => (
                  <MobileRow key={opp.id} opp={opp} onClick={() => onRowClick(opp)} />
                ))}
              </div>
            ) : (
              <div>
                {rows.map((opp) => (
                  <DesktopRow
                    key={opp.id}
                    opp={opp}
                    active={opp.id === selectedId}
                    onClick={() => onRowClick(opp)}
                  />
                ))}
              </div>
            )}

            {meta && meta.total > 0 ? (
              <div className={styles.pagination}>
                <span className={styles.pageLabel}>
                  {(page - 1) * PAGE_LIMIT + 1}–{Math.min(page * PAGE_LIMIT, meta.total)} of {meta.total}
                </span>
                <div className={styles.pageBtns}>
                  <button
                    type="button"
                    className={styles.pageBtn}
                    disabled={page <= 1}
                    onClick={() => setParams({ page: String(page - 1) }, false)}
                  >
                    ‹
                  </button>
                  <span className={styles.pageCurrent}>
                    {page} / {meta.totalPages || 1}
                  </span>
                  <button
                    type="button"
                    className={styles.pageBtn}
                    disabled={page >= (meta.totalPages || 1)}
                    onClick={() => setParams({ page: String(page + 1) }, false)}
                  >
                    ›
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {!isMobile && selected ? (
        <OpportunityPanel opp={selected} onClose={() => setSelectedId(null)} />
      ) : null}
    </div>
  );
}

function DesktopRow({
  opp,
  active,
  onClick,
}: {
  opp: Opportunity;
  active: boolean;
  onClick: () => void;
}) {
  const rel = relativeDeadline(opp.deadlineAt);
  return (
    <div className={styles.row} data-active={active} onClick={onClick}>
      <div className={styles.cellTitle}>
        <Monogram name={opp.organization ?? opp.title} size={30} />
        <div className={styles.titleBox}>
          <div className={styles.rowTitle}>{opp.title}</div>
          {opp.nextAction ? <div className={styles.rowNote}>{opp.nextAction}</div> : null}
        </div>
      </div>
      <div className={styles.cellMuted}>{opp.organization || "—"}</div>
      <div>
        <span className="chip">{TYPE_LABEL[opp.type]}</span>
      </div>
      <div>
        <div className={styles.dateLabel}>{formatDate(opp.deadlineAt)}</div>
        <div className={styles.relLabel} data-tone={rel.tone}>
          {rel.label}
        </div>
      </div>
      <div>
        <span className="chip" data-status={opp.status}>
          {STATUS_LABEL[opp.status]}
        </span>
      </div>
      <div>
        <span className="chip" data-priority={opp.priority}>
          {PRIORITY_LABEL[opp.priority]}
        </span>
      </div>
    </div>
  );
}

function MobileRow({ opp, onClick }: { opp: Opportunity; onClick: () => void }) {
  const rel = relativeDeadline(opp.deadlineAt);
  return (
    <div className={styles.mobileRow} onClick={onClick}>
      <Monogram name={opp.organization ?? opp.title} size={34} />
      <div className={styles.mobileBody}>
        <div className={styles.rowTitle}>{opp.title}</div>
        <div className={styles.mobileMeta}>
          {opp.organization ? `${opp.organization} · ` : ""}
          {TYPE_LABEL[opp.type]}
        </div>
        <div className={styles.mobileChips}>
          <span className="chip" data-status={opp.status}>
            {STATUS_LABEL[opp.status]}
          </span>
          <span className="chip" data-tone={rel.tone}>
            {rel.label}
          </span>
        </div>
      </div>
    </div>
  );
}

function TableSkeleton({ mobile }: { mobile: boolean }) {
  return (
    <div>
      {[0, 1, 2, 3, 4, 5].map((i) =>
        mobile ? (
          <div key={i} className={styles.mobileRow}>
            <div className="skeleton" style={{ width: 34, height: 34, borderRadius: 9 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ height: 13, width: "60%" }} />
              <div className="skeleton" style={{ height: 11, width: "40%", marginTop: 8 }} />
            </div>
          </div>
        ) : (
          <div key={i} className={styles.row} style={{ cursor: "default" }}>
            <div className={styles.cellTitle}>
              <div className="skeleton" style={{ width: 30, height: 30, borderRadius: 8 }} />
              <div className="skeleton" style={{ height: 12, width: "70%" }} />
            </div>
            <div className="skeleton" style={{ height: 12 }} />
            <div className="skeleton" style={{ height: 12 }} />
            <div className="skeleton" style={{ height: 12 }} />
            <div className="skeleton" style={{ height: 12 }} />
            <div className="skeleton" style={{ height: 12 }} />
          </div>
        ),
      )}
    </div>
  );
}
