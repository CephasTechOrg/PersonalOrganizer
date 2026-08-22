"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/ui/lib/api";
import styles from "./login.module.css";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/api/auth/login", { email, password });
      router.replace("/");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.code === "RATE_LIMITED"
            ? "Too many attempts. Try again in a few minutes."
            : "Invalid email or password.",
        );
      } else {
        setError("Something went wrong. Please try again.");
      }
      setSubmitting(false);
    }
  }

  return (
    <main className={styles.screen}>
      <div className={styles.wrap}>
        <div className={styles.brand}>
          <span className={styles.mark}>P</span>
          <span className={styles.brandName}>Personal Hub</span>
        </div>

        <div className={styles.card}>
          <h1 className={styles.title}>Welcome back</h1>
          <p className={styles.subtitle}>Sign in to access your personal workspace.</p>

          <form className={styles.form} onSubmit={onSubmit}>
            <label className={styles.label}>
              <span className="field-label">Email</span>
              <input
                type="email"
                autoComplete="username"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus
              />
            </label>

            <label className={styles.label}>
              <span className="field-label">Password</span>
              <input
                type="password"
                autoComplete="current-password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                required
              />
            </label>

            {error ? <div className={styles.error}>{error}</div> : null}

            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        <p className={styles.footnote}>Private workspace · single account</p>
      </div>
    </main>
  );
}
