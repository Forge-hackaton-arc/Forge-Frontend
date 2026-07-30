"use client";

import * as React from "react";
import {
  type StoredIdentity,
  getActiveIdentityId,
  getStoredIdentities,
  removeIdentity as removeStoredIdentity,
  saveIdentity as saveStoredIdentity,
  setActiveIdentityId,
} from "@/lib/identity";

interface IdentityContextValue {
  identities: StoredIdentity[];
  activeId: string | null;
  active: StoredIdentity | null;
  addIdentity: (identity: StoredIdentity) => void;
  removeIdentity: (agentId: string) => void;
  setActive: (agentId: string | null) => void;
}

const IdentityContext = React.createContext<IdentityContextValue | null>(null);

export function IdentityProvider({ children }: { children: React.ReactNode }) {
  const [identities, setIdentities] = React.useState<StoredIdentity[]>([]);
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const sync = React.useCallback(() => {
    setIdentities(getStoredIdentities());
    setActiveId(getActiveIdentityId());
  }, []);

  React.useEffect(() => {
    sync();
    window.addEventListener("forge:identities-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("forge:identities-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, [sync]);

  const value: IdentityContextValue = {
    identities,
    activeId,
    active: identities.find((i) => i.agentId === activeId) ?? null,
    addIdentity: (identity) => {
      saveStoredIdentity(identity);
      setActiveIdentityId(identity.agentId);
    },
    removeIdentity: (agentId) => removeStoredIdentity(agentId),
    setActive: (agentId) => setActiveIdentityId(agentId),
  };

  return <IdentityContext.Provider value={value}>{children}</IdentityContext.Provider>;
}

export function useIdentity() {
  const ctx = React.useContext(IdentityContext);
  if (!ctx) throw new Error("useIdentity must be used within IdentityProvider");
  return ctx;
}
