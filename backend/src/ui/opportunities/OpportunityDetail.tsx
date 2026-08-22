"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/ui/components/EmptyState";
import { Monogram } from "@/ui/components/Monogram";
import { ExternalIcon } from "@/ui/components/icons";
import { api } from "@/ui/lib/api";
import {
  PRIORITY_LABEL,
  TYPE_LABEL,
  formatDate,
  openingState,
  relativeDeadline,
} from "@/ui/lib/format";
import { setOpportunityStatus } from "@/ui/lib/mutations";
import { useResource } from "@/ui/lib/useResource";
import type { Opportunity } from "@/ui/lib/types";
import { useQuickAdd } from "@/ui/shell/QuickAddProvider";
import { useToast } from "@/ui/shell/ToastProvider";
import { EditOpportunityModal } from "./EditOpportunityModal";
import { LinkedTasks } from "./LinkedTasks";
import { NotesEditor } from "./NotesEditor";
import { StatusMenu } from "./StatusMenu";
import styles from "./OpportunityDetail.module.css";

export function OpportunityDetail({ id }: { id: string }) {
  const router = useRouter();
  const toast = useToast();
  const quickAdd = useQuickAdd();
  const [editing, setEditing] = useState(false);

  const { data, loading, error, reload } = useResource<Opportunity>(
    () => api.get<Opportunity>(`/api/opportunities/${id}`),
    [id],
  );

  if (loading && !data) return <DetailSkeleton />;

  if (error && !data) {
    return (
      <EmptyState
        title="Opportunity not found"
        description="It may have been deleted."
        action={
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={reload}>
              Try again
            </button>
            <Link href="/opportunities" className="btn btn-primary">
              Back to opportunities
            </Link>
          </div>
        }
      />
    );
  }

  const opp = data as Opportunity;
  const rel = relativeDeadline(opp.deadlineAt);
  const opening = openingState(opp.openAt);
  const link = opp.applicationUrl || opp.sourceUrl;
  const canApply = opp.status === "need_to_apply" || opp.status === "saved";

  function apply() {
    if (link) window.open(link, "_blank", "noopener,noreferrer");
    if (canApply) {
      setOpportunityStatus(opp.id, "applied").then(
        () => toast.success("Marked as applied."),
        () => toast.error("Couldn't update status."),
      );
    }
  }

  function markApplied() {
    setOpportunityStatus(opp.id, "applied").then(
      () => toast.success("Marked as applied."),
      () => toast.error("Couldn't update status."),
    );
  }

  const infoRow = [
    { k: "Type", v: TYPE_LABEL[opp.type] },
    { k: "Opens", v: opp.openAt ? formatDate(opp.openAt) : "Already open" },
    { k: "Location", v: opp.location || (opp.isRemote ? "Remote" : "—") },
    { k: "Follow-up", v: formatDate(opp.followUpAt) },
    { k: "Applied", v: formatDate(opp.appliedAt) },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.mainCol}>
        <button type="button" className={styles.back} onClick={() => router.push("/opportunities")}>
          ← Back to opportunities
        </button>

        <div className={styles.head}>
          <Monogram name={opp.organization ?? opp.title} size={52} />
          <div className={styles.headBody}>
            <h1 className={styles.title}>{opp.title}</h1>
            <div className={styles.org}>
              {opp.organization ? `${opp.organization} · ` : ""}
              {TYPE_LABEL[opp.type]}
            </div>
            <div className={styles.chips}>
              <StatusMenu id={opp.id} status={opp.status} />
              {opening.label ? (
                <span className="chip" data-tone={opening.tone}>
                  {opening.label}
                </span>
              ) : null}
              <span className="chip" data-priority={opp.priority}>
                {PRIORITY_LABEL[opp.priority]} priority
              </span>
              <span className="chip" data-tone={rel.tone}>
                {rel.label}
              </span>
            </div>
          </div>
          <div className={styles.deadlineBox}>
            <div className={styles.deadlineLabel}>Deadline</div>
            <div className={styles.deadlineValue} data-tone={rel.tone}>
              {formatDate(opp.deadlineAt)}
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          {link ? (
            <button type="button" className="btn btn-primary" onClick={apply}>
              {canApply ? "Apply now" : "Open link"}
              <ExternalIcon width={15} height={15} />
            </button>
          ) : null}
          {opp.sourceUrl ? (
            <a className="btn btn-secondary" href={opp.sourceUrl} target="_blank" rel="noopener noreferrer">
              Open source link
            </a>
          ) : null}
          {opp.status !== "applied" ? (
            <button type="button" className="btn btn-secondary" onClick={markApplied}>
              Mark applied
            </button>
          ) : null}
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => quickAdd.open("task", { opportunityId: opp.id, opportunityTitle: opp.title })}
          >
            + Add task
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setEditing(true)}>
            Edit
          </button>
        </div>

        {opp.applicationUrl ? (
          <div className={styles.urlCard}>
            <div className={styles.urlBody}>
              <div className={styles.urlLabel}>Application URL</div>
              <a className={styles.url} href={opp.applicationUrl} target="_blank" rel="noopener noreferrer">
                {opp.applicationUrl}
              </a>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                navigator.clipboard?.writeText(opp.applicationUrl as string);
                toast.success("Link copied.");
              }}
            >
              Copy
            </button>
          </div>
        ) : null}

        <div className={styles.infoRow}>
          {infoRow.map((f) => (
            <div key={f.k}>
              <div className={styles.infoKey}>{f.k}</div>
              <div className={styles.infoVal}>{f.v}</div>
            </div>
          ))}
        </div>

        {opp.description ? (
          <div className={styles.descBlock}>
            <div className={styles.blockTitle}>Description</div>
            <p className={styles.desc}>{opp.description}</p>
          </div>
        ) : null}

        <div className={styles.twoCol}>
          <div>
            <div className={styles.blockTitle}>Tasks</div>
            <div style={{ marginTop: 12 }}>
              <LinkedTasks opportunityId={opp.id} opportunityTitle={opp.title} />
            </div>
          </div>
          <div>
            <div className={styles.blockTitle}>Notes</div>
            <div style={{ marginTop: 12 }}>
              <NotesEditor id={opp.id} initialNotes={opp.notes} />
            </div>
          </div>
        </div>
      </div>

      <aside className={styles.rail}>
        <div className="card" style={{ padding: 16 }}>
          <div className={styles.blockTitle}>Quick facts</div>
          <div className={styles.facts}>
            <Fact k="Organization" v={opp.organization || "—"} />
            <Fact k="Type" v={TYPE_LABEL[opp.type]} />
            <Fact
              k="Opening date"
              v={opp.openAt ? `${formatDate(opp.openAt)} · ${opening.label}` : "Already open"}
            />
            <Fact k="Deadline" v={opp.deadlineAt ? `${formatDate(opp.deadlineAt)} · ${rel.label}` : "No deadline"} />
            <Fact k="Follow-up" v={formatDate(opp.followUpAt)} />
            <Fact k="Location" v={opp.location || (opp.isRemote ? "Remote" : "—")} />
            <Fact k="Created" v={formatDate(opp.createdAt)} />
          </div>
        </div>
      </aside>

      <EditOpportunityModal opp={opp} open={editing} onClose={() => setEditing(false)} />
    </div>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className={styles.factKey}>{k}</div>
      <div className={styles.factVal}>{v}</div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className={styles.page}>
      <div className={styles.mainCol}>
        <div className="skeleton" style={{ height: 14, width: 160 }} />
        <div style={{ display: "flex", gap: 16, marginTop: 20 }}>
          <div className="skeleton" style={{ width: 52, height: 52, borderRadius: 12 }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ height: 24, width: "50%" }} />
            <div className="skeleton" style={{ height: 14, width: "30%", marginTop: 10 }} />
          </div>
        </div>
        <div className="skeleton" style={{ height: 40, marginTop: 22 }} />
        <div className="skeleton" style={{ height: 200, marginTop: 22 }} />
      </div>
      <aside className={styles.rail}>
        <div className="card skeleton" style={{ height: 240 }} />
      </aside>
    </div>
  );
}
