"use client";

import { useEffect } from "react";

const EVENT_NAME = "ph:data-changed";

/** Notify all subscribed views that server data changed (create/update/delete). */
export function emitDataChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

/** Subscribe a view to data-changed notifications (e.g. to refetch a list). */
export function useDataChanged(callback: () => void): void {
  useEffect(() => {
    function handler() {
      callback();
    }
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, [callback]);
}
