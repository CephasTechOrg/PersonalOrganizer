"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";

const OwnerContext = createContext<string>("");

export function useOwnerEmail(): string {
  return useContext(OwnerContext);
}

export function useOwnerFirstName(): string {
  const email = useContext(OwnerContext);
  const local = email.split("@")[0] || "";
  const first = local.split(/[._-]/)[0] || local;
  if (!first) return "there";
  return first.charAt(0).toUpperCase() + first.slice(1);
}

export function OwnerProvider({
  email,
  children,
}: {
  email: string;
  children: ReactNode;
}) {
  return <OwnerContext.Provider value={email}>{children}</OwnerContext.Provider>;
}
