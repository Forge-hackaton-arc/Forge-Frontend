"use client";

import * as React from "react";

export type Network = "testnet" | "mainnet";

const STORAGE_KEY = "forge:network";

interface NetworkContextValue {
  network: Network;
  setNetwork: (network: Network) => void;
}

const NetworkContext = React.createContext<NetworkContextValue | null>(null);

// Purely a UI/theme toggle — see components/layout/network-toggle.tsx. The
// backend and contracts are testnet-only for this MVP (no mainnet
// deployment, per the project's own non-goals), so this never changes which
// API or chain the app actually talks to. It exists so the interior team can
// preview the mainnet-warm theme and so the distinction stays visually
// unmistakable if/when this ever points at something real.
export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [network, setNetworkState] = React.useState<Network>("testnet");

  React.useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "mainnet" || stored === "testnet") setNetworkState(stored);
  }, []);

  React.useEffect(() => {
    document.documentElement.dataset.network = network;
  }, [network]);

  const setNetwork = React.useCallback((next: Network) => {
    setNetworkState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  return <NetworkContext.Provider value={{ network, setNetwork }}>{children}</NetworkContext.Provider>;
}

export function useNetwork() {
  const ctx = React.useContext(NetworkContext);
  if (!ctx) throw new Error("useNetwork must be used within NetworkProvider");
  return ctx;
}
