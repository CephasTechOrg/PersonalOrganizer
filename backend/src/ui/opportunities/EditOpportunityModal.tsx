"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/ui/components/Modal";
import { ApiError } from "@/ui/lib/api";
import {
  PRIORITY_LABEL,
  STATUS_LABEL,
  TYPE_LABEL,
} from "@/ui/lib/format";
import { updateOpportunity } from "@/ui/lib/mutations";
import type {
  Opportunity,
  OpportunityStatus,
  OpportunityType,
  Priority,
} from "@/ui/lib/types";
import { useToast } from "@/ui/shell/ToastProvider";
import formStyles from "@/ui/shell/QuickAddModal.module.css";

const TYPES = Object.keys(TYPE_LABEL) as OpportunityType[];
const STATUSES = Object.keys(STATUS_LABEL) as OpportunityStatus[];
const PRIORITIES: Priority[] = ["low", "normal", "high", "urgent"];

function toDateInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function toIso(dateInput: string): string | null {
  return dateInput ? new Date(dateInput).toISOString() : null;
}

interface EditOpportunityModalProps {
  opp: Opportunity;
  open: boolean;
  onClose: () => void;
}

export function EditOpportunityModal({ opp, open, onClose }: EditOpportunityModalProps) {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(opp.title);
  const [organization, setOrganization] = useState(opp.organization ?? "");
  const [type, setType] = useState<OpportunityType>(opp.type);
  const [status, setStatus] = useState<OpportunityStatus>(opp.status);
  const [priority, setPriority] = useState<Priority>(opp.priority);
  const [openAt, setOpenAt] = useState(toDateInput(opp.openAt));
  const [deadlineAt, setDeadlineAt] = useState(toDateInput(opp.deadlineAt));
  const [followUpAt, setFollowUpAt] = useState(toDateInput(opp.followUpAt));
  const [location, setLocation] = useState(opp.location ?? "");
  const [isRemote, setIsRemote] = useState(!!opp.isRemote);
  const [applicationUrl, setApplicationUrl] = useState(opp.applicationUrl ?? "");
  const [sourceUrl, setSourceUrl] = useState(opp.sourceUrl ?? "");
  const [description, setDescription] = useState(opp.description ?? "");

  useEffect(() => {
    if (open) {
      setError(null);
      setSubmitting(false);
      setTitle(opp.title);
      setOrganization(opp.organization ?? "");
      setType(opp.type);
      setStatus(opp.status);
      setPriority(opp.priority);
      setOpenAt(toDateInput(opp.openAt));
      setDeadlineAt(toDateInput(opp.deadlineAt));
      setFollowUpAt(toDateInput(opp.followUpAt));
      setLocation(opp.location ?? "");
      setIsRemote(!!opp.isRemote);
      setApplicationUrl(opp.applicationUrl ?? "");
      setSourceUrl(opp.sourceUrl ?? "");
      setDescription(opp.description ?? "");
    }
  }, [open, opp]);

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
      await updateOpportunity(opp.id, {
        title: title.trim(),
        organization: organization.trim() || null,
        type,
        status,
        priority,
        openAt: toIso(openAt),
        deadlineAt: toIso(deadlineAt),
        followUpAt: toIso(followUpAt),
        location: location.trim() || null,
        isRemote,
        applicationUrl: applicationUrl.trim() || null,
        sourceUrl: sourceUrl.trim() || null,
        description: description.trim() || null,
      });
      toast.success("Opportunity updated.");
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save changes.");
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit opportunity"
      subtitle="Update details, opening date, deadline, and status."
      width={620}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="edit-opp-form" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Saving…" : "Save changes"}
          </button>
        </>
      }
    >
      <form id="edit-opp-form" className={formStyles.form} onSubmit={onSubmit}>
        <label className={formStyles.field}>
          <span className="field-label">Title</span>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>

        <div className={formStyles.row}>
          <label className={formStyles.field}>
            <span className="field-label">Organization</span>
            <input className="input" value={organization} onChange={(e) => setOrganization(e.target.value)} />
          </label>
          <label className={formStyles.field}>
            <span className="field-label">Type</span>
            <select className="select" value={type} onChange={(e) => setType(e.target.value as OpportunityType)}>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className={formStyles.row}>
          <label className={formStyles.field}>
            <span className="field-label">Status</span>
            <select className="select" value={status} onChange={(e) => setStatus(e.target.value as OpportunityStatus)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
          <label className={formStyles.field}>
            <span className="field-label">Priority</span>
            <select className="select" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABEL[p]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className={formStyles.row}>
          <label className={formStyles.field}>
            <span className="field-label">Opening date</span>
            <input type="date" className="input" value={openAt} onChange={(e) => setOpenAt(e.target.value)} />
            <span className={formStyles.fieldHint}>Leave blank if already open</span>
          </label>
          <label className={formStyles.field}>
            <span className="field-label">Deadline</span>
            <input type="date" className="input" value={deadlineAt} onChange={(e) => setDeadlineAt(e.target.value)} />
          </label>
        </div>

        <div className={formStyles.row}>
          <label className={formStyles.field}>
            <span className="field-label">Follow-up</span>
            <input type="date" className="input" value={followUpAt} onChange={(e) => setFollowUpAt(e.target.value)} />
          </label>
          <label className={formStyles.field}>
            <span className="field-label">Location</span>
            <input className="input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City / Remote" />
          </label>
        </div>

        <label className={formStyles.checkboxRow}>
          <input type="checkbox" checked={isRemote} onChange={(e) => setIsRemote(e.target.checked)} />
          <span>Remote</span>
        </label>

        <div className={formStyles.row}>
          <label className={formStyles.field}>
            <span className="field-label">Application URL</span>
            <input className="input" value={applicationUrl} onChange={(e) => setApplicationUrl(e.target.value)} placeholder="https://…/apply" />
          </label>
          <label className={formStyles.field}>
            <span className="field-label">Source URL</span>
            <input className="input" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://…" />
          </label>
        </div>

        <label className={formStyles.field}>
          <span className="field-label">Description</span>
          <textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </label>

        {error ? <div className={formStyles.error}>{error}</div> : null}
      </form>
    </Modal>
  );
}
