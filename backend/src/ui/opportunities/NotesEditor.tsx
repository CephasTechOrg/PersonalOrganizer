"use client";

import { useEffect, useState } from "react";
import { updateOpportunity } from "@/ui/lib/mutations";
import { useToast } from "@/ui/shell/ToastProvider";
import styles from "./NotesEditor.module.css";

interface NotesEditorProps {
  id: string;
  initialNotes: string | null;
}

export function NotesEditor({ id, initialNotes }: NotesEditorProps) {
  const toast = useToast();
  const [value, setValue] = useState(initialNotes ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(initialNotes ?? "");
  }, [initialNotes]);

  const dirty = value !== (initialNotes ?? "");

  async function save() {
    if (!dirty || saving) return;
    setSaving(true);
    try {
      await updateOpportunity(id, { notes: value.trim() || null });
      toast.success("Notes saved.");
    } catch {
      toast.error("Couldn't save notes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <textarea
        className={`textarea ${styles.area}`}
        placeholder="Add notes about this opportunity…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <div className={styles.footer}>
        <span className={styles.hint}>{dirty ? "Unsaved changes" : "Saved"}</span>
        <button type="button" className="btn btn-secondary btn-sm" disabled={!dirty || saving} onClick={save}>
          {saving ? "Saving…" : "Save note"}
        </button>
      </div>
    </div>
  );
}
