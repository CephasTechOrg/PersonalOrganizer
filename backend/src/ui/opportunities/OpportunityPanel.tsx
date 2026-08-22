"use client";

import Link from "next/link";
import { Monogram } from "@/ui/components/Monogram";
import { ExternalIcon } from "@/ui/components/icons";
import {
  PRIORITY_LABEL,
  TYPE_LABEL,
  formatDate,
  relativeDeadline,
} from "@/ui/lib/format";
import { setOpportunityStatus } from "@/ui/lib/mutations";
import type { Opportunity } from "@/ui/lib/types";
import { useToast } from "@/ui/shell/ToastProvider";
import { LinkedTasks } from "./LinkedTasks";
import { StatusMenu } from "./StatusMenu";
import styles from "./OpportunityPanel.module.css";

interface OpportunityPanelProps {
  opp: Opportunity;
  onClose: () => void;
}

export function OpportunityPanel({ opp, onClose }: OpportunityPanelProps) {
  const toast = useToast();
  const rel = relativeDeadline(opp.deadlineAt);
  const applyUrl = opp.applicationUrl;
  const sourceUrl = opp.sourceUrl;
  const canApply = opp.status === "need_to_apply" || opp.status === "saved";

  function apply() {
    const link = applyUrl || sourceUrl;
    if (link) window.open(link, "_blank", "noopener,noreferrer");
    if (canApply) {
      setOpportunityStatus(opp.id, "applied").then(
        () => toast.success("Marked as applied."),
        () => toast.error("Couldn't update status."),
      );
    }
  }

  const facts: { k: string; v: string; tone?: string }[] = [
    { k: "Organization", v: opp.organization || "—" },
    { k: "Type", v: TYPE_LABEL[opp.type] },
    { k: "Deadline", v: opp.deadlineAt ? `${formatDate(opp.deadlineAt)} · ${rel.label}` : "No deadline", tone: rel.tone },
    { k: "Follow-up", v: formatDate(opp.followUpAt) },
    { k: "Location", v: opp.location || (opp.isRemote ? "Remote" : "—") },
    { k: "Priority", v: PRIORITY_LABEL[opp.priority] },
  ];

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <Monogram name={opp.organization ?? opp.title} size={38} />
        <div className={styles.headerBody}>
          <div className={styles.title}>{opp.title}</div>
          <div className={styles.subtitle}>
            {opp.organization ? `${opp.organization} · ` : ""}
            {TYPE_LABEL[opp.type]}
          </div>
          <div className={styles.chips}>
            <StatusMenu id={opp.id} status={opp.status} />
          </div>
        </div>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>

      <div className={styles.actions}>
        {applyUrl || sourceUrl ? (
          <button type="button" className="btn btn-primary btn-sm" onClick={apply}>
            {canApply ? "Apply" : "Open link"}
            <ExternalIcon width={14} height={14} />
          </button>
        ) : null}
        {sourceUrl ? (
          <a
            className="btn btn-secondary btn-sm"
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Source
          </a>
        ) : null}
      </div>

      <div className={styles.section}>
        {opp.description ? <p className={styles.desc}>{opp.description}</p> : null}
        <div className={styles.facts}>
          {facts.map((f) => (
            <div key={f.k} className={styles.fact}>
              <span className={styles.factKey}>{f.k}</span>
              <span className={styles.factVal} data-tone={f.tone}>
                {f.v}
              </span>
            </div>
          ))}
        </div>
      </div>

      {opp.notes ? (
        <div className={styles.section}>
          <div className={styles.notesLabel}>Notes</div>
          <p className={styles.notes}>{opp.notes}</p>
        </div>
      ) : null}

      <div className={styles.section}>
        <LinkedTasks opportunityId={opp.id} opportunityTitle={opp.title} />
      </div>

      <div className={styles.footer}>
        <Link href={`/opportunities/${opp.id}`} className="btn btn-secondary btn-sm" style={{ width: "100%" }}>
          Open full workspace →
        </Link>
      </div>
    </aside>
  );
}
