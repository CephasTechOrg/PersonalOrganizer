"use client";

import { useEffect, useRef, useState } from "react";
import { STATUS_LABEL } from "@/ui/lib/format";
import { setOpportunityStatus } from "@/ui/lib/mutations";
import type { OpportunityStatus } from "@/ui/lib/types";
import { useToast } from "@/ui/shell/ToastProvider";
import styles from "./StatusMenu.module.css";

const ALL_STATUSES: OpportunityStatus[] = [
  "saved",
  "need_to_apply",
  "in_progress",
  "applied",
  "waiting",
  "interview",
  "accepted",
  "rejected",
  "withdrawn",
  "archived",
];

interface StatusMenuProps {
  id: string;
  status: OpportunityStatus;
  onChanged?: (status: OpportunityStatus) => void;
}

export function StatusMenu({ id, status, onChanged }: StatusMenuProps) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function choose(next: OpportunityStatus) {
    setOpen(false);
    if (next === status || busy) return;
    setBusy(true);
    try {
      await setOpportunityStatus(id, next);
      toast.success(`Moved to ${STATUS_LABEL[next]}.`);
      onChanged?.(next);
    } catch {
      toast.error("Couldn't update status.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.wrap} ref={ref}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((o) => !o)}
        disabled={busy}
      >
        <span className="chip" data-status={status}>
          {STATUS_LABEL[status]}
        </span>
        <span className={styles.caret}>▾</span>
      </button>
      {open ? (
        <div className={styles.menu}>
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              className={styles.option}
              data-active={s === status}
              onClick={() => choose(s)}
            >
              <span className="chip" data-status={s}>
                {STATUS_LABEL[s]}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
