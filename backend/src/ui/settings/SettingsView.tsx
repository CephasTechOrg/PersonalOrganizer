"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/ui/lib/api";
import { useOwnerEmail } from "@/ui/shell/OwnerContext";
import styles from "./SettingsView.module.css";

export function SettingsView() {
  const email = useOwnerEmail();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    await api.post("/api/auth/logout", {}).catch(() => undefined);
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Settings</h1>
      <p className={styles.subtitle}>Manage your private workspace.</p>

      <div className="card" style={{ padding: 20, marginTop: 24 }}>
        <div className={styles.sectionTitle}>Account</div>
        <div className={styles.row}>
          <div>
            <div className={styles.label}>Signed in as</div>
            <div className={styles.value}>{email}</div>
          </div>
        </div>
        <div className={styles.row}>
          <div>
            <div className={styles.label}>Access</div>
            <div className={styles.value}>Owner-only · private workspace</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 20, marginTop: 18 }}>
        <div className={styles.sectionTitle}>Session</div>
        <p className={styles.help}>
          Signing out clears your session on this device. You&apos;ll need your password to sign back in.
        </p>
        <button type="button" className="btn btn-secondary" onClick={signOut} disabled={signingOut}>
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </div>
  );
}
