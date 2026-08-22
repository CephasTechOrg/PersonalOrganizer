"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/ui/components/Modal";
import { api, ApiError } from "@/ui/lib/api";
import { emitDataChanged } from "@/ui/lib/events";
import { TASK_KIND_LABEL, TYPE_LABEL } from "@/ui/lib/format";
import type {
  OpportunityType,
  Priority,
  TaskKind,
} from "@/ui/lib/types";
import type { QuickAddPresets } from "./QuickAddProvider";
import { useToast } from "./ToastProvider";
import styles from "./QuickAddModal.module.css";

export type QuickAddMode = "opportunity" | "task";

const OPP_TYPES = Object.keys(TYPE_LABEL) as OpportunityType[];
const TASK_KINDS = Object.keys(TASK_KIND_LABEL) as TaskKind[];
const PRIORITIES: Priority[] = ["low", "normal", "high", "urgent"];

interface QuickAddModalProps {
  open: boolean;
  mode: QuickAddMode;
  presets?: QuickAddPresets;
  onClose: () => void;
}

export function QuickAddModal({ open, mode, presets, onClose }: QuickAddModalProps) {
  const toast = useToast();
  const [tab, setTab] = useState<QuickAddMode>(mode);
  const [advanced, setAdvanced] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Opportunity fields
  const [title, setTitle] = useState("");
  const [organization, setOrganization] = useState("");
  const [type, setType] = useState<OpportunityType>("program");
  const [priority, setPriority] = useState<Priority>("normal");
  const [openAt, setOpenAt] = useState("");
  const [deadlineAt, setDeadlineAt] = useState("");
  const [applicationUrl, setApplicationUrl] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");

  // Task fields
  const [kind, setKind] = useState<TaskKind>("complete");
  const [dueAt, setDueAt] = useState("");
  const [actionUrl, setActionUrl] = useState("");

  // Shared
  const [notes, setNotes] = useState("");

  const lockTask = !!presets?.opportunityId;

  useEffect(() => {
    if (open) {
      setTab(lockTask ? "task" : mode);
      setAdvanced(false);
      setError(null);
      setSubmitting(false);
      setTitle("");
      setOrganization("");
      setType("program");
      setPriority("normal");
      setOpenAt("");
      setDeadlineAt("");
      setApplicationUrl("");
      setSourceUrl("");
      setKind("complete");
      setDueAt("");
      setActionUrl("");
      setNotes("");
    }
  }, [open, mode]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    if (!title.trim()) {
      setError("A title is required.");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      if (tab === "opportunity") {
        await api.post("/api/opportunities", {
          title: title.trim(),
          organization: organization.trim() || null,
          type,
          priority,
          openAt: openAt ? new Date(openAt).toISOString() : null,
          deadlineAt: deadlineAt ? new Date(deadlineAt).toISOString() : null,
          applicationUrl: applicationUrl.trim() || null,
          sourceUrl: sourceUrl.trim() || null,
          notes: notes.trim() || null,
        });
        toast.success("Opportunity added.");
      } else {
        await api.post("/api/tasks", {
          title: title.trim(),
          kind,
          priority,
          dueAt: dueAt ? new Date(dueAt).toISOString() : null,
          actionUrl: actionUrl.trim() || null,
          opportunityId: presets?.opportunityId ?? null,
          notes: notes.trim() || null,
        });
        toast.success("Task added.");
      }
      emitDataChanged();
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not save. Please try again.",
      );
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Quick add"
      subtitle="Save it now, enrich the details later."
      width={560}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="quick-add-form" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Saving…" : tab === "opportunity" ? "Save opportunity" : "Add task"}
          </button>
        </>
      }
    >
      {lockTask ? (
        presets?.opportunityTitle ? (
          <div className={styles.context}>
            Task for <strong>{presets.opportunityTitle}</strong>
          </div>
        ) : null
      ) : (
        <div className={styles.tabs}>
          <button
            type="button"
            className={styles.tab}
            data-active={tab === "opportunity"}
            onClick={() => setTab("opportunity")}
          >
            Opportunity
          </button>
          <button
            type="button"
            className={styles.tab}
            data-active={tab === "task"}
            onClick={() => setTab("task")}
          >
            Task
          </button>
        </div>
      )}

      <form id="quick-add-form" className={styles.form} onSubmit={onSubmit}>
        <label className={styles.field}>
          <span className="field-label">
            {tab === "opportunity" ? "Opportunity title" : "Task title"}
          </span>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={tab === "opportunity" ? "e.g. Seed Grant Program" : "e.g. Draft fellowship essay"}
            autoFocus
            required
          />
        </label>

        {tab === "opportunity" ? (
          <>
            <div className={styles.row}>
              <label className={styles.field}>
                <span className="field-label">Organization</span>
                <input
                  className="input"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="Optional"
                />
              </label>
              <label className={styles.field}>
                <span className="field-label">Type</span>
                <select className="select" value={type} onChange={(e) => setType(e.target.value as OpportunityType)}>
                  {OPP_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {TYPE_LABEL[t]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className={styles.row}>
              <label className={styles.field}>
                <span className="field-label">Opening date</span>
                <input
                  type="date"
                  className="input"
                  value={openAt}
                  onChange={(e) => setOpenAt(e.target.value)}
                />
                <span className={styles.fieldHint}>Leave blank if already open</span>
              </label>
              <label className={styles.field}>
                <span className="field-label">Deadline</span>
                <input
                  type="date"
                  className="input"
                  value={deadlineAt}
                  onChange={(e) => setDeadlineAt(e.target.value)}
                />
              </label>
            </div>

            <label className={styles.field}>
              <span className="field-label">Priority</span>
              <select
                className="select"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p[0].toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span className="field-label">Notes</span>
              <textarea
                className="textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional — essay required, eligibility, reminders…"
                rows={2}
              />
            </label>

            <button
              type="button"
              className={styles.advancedToggle}
              onClick={() => setAdvanced((a) => !a)}
            >
              {advanced ? "− Hide links" : "+ Add links"}
            </button>

            {advanced ? (
              <>
                <label className={styles.field}>
                  <span className="field-label">Application URL</span>
                  <input
                    className="input"
                    value={applicationUrl}
                    onChange={(e) => setApplicationUrl(e.target.value)}
                    placeholder="https://…/apply"
                  />
                </label>
                <label className={styles.field}>
                  <span className="field-label">Source URL</span>
                  <input
                    className="input"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    placeholder="https://…"
                  />
                </label>
              </>
            ) : null}
          </>
        ) : (
          <>
            <div className={styles.row}>
              <label className={styles.field}>
                <span className="field-label">Kind</span>
                <select className="select" value={kind} onChange={(e) => setKind(e.target.value as TaskKind)}>
                  {TASK_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {TASK_KIND_LABEL[k]}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span className="field-label">Due date</span>
                <input
                  type="date"
                  className="input"
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                />
              </label>
            </div>
            <label className={styles.field}>
              <span className="field-label">Action URL</span>
              <input
                className="input"
                value={actionUrl}
                onChange={(e) => setActionUrl(e.target.value)}
                placeholder="Optional link to open"
              />
            </label>
            <label className={styles.field}>
              <span className="field-label">Notes</span>
              <textarea
                className="textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional details…"
                rows={2}
              />
            </label>
          </>
        )}

        {error ? <div className={styles.error}>{error}</div> : null}
      </form>
    </Modal>
  );
}
