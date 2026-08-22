"use client";

import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";
import { QuickAddModal, type QuickAddMode } from "./QuickAddModal";

export interface QuickAddPresets {
  opportunityId?: string;
  opportunityTitle?: string;
}

interface QuickAddApi {
  open: (mode?: QuickAddMode, presets?: QuickAddPresets) => void;
}

const QuickAddContext = createContext<QuickAddApi | null>(null);

export function useQuickAdd(): QuickAddApi {
  const ctx = useContext(QuickAddContext);
  if (!ctx) throw new Error("useQuickAdd must be used within QuickAddProvider");
  return ctx;
}

interface OpenState {
  open: boolean;
  mode: QuickAddMode;
  presets: QuickAddPresets;
}

export function QuickAddProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OpenState>({
    open: false,
    mode: "opportunity",
    presets: {},
  });

  const open = useCallback((mode: QuickAddMode = "opportunity", presets: QuickAddPresets = {}) => {
    setState({ open: true, mode, presets });
  }, []);

  const close = useCallback(() => {
    setState((s) => ({ ...s, open: false }));
  }, []);

  return (
    <QuickAddContext.Provider value={{ open }}>
      {children}
      <QuickAddModal open={state.open} mode={state.mode} presets={state.presets} onClose={close} />
    </QuickAddContext.Provider>
  );
}
