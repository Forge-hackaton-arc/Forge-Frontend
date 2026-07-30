"use client";

import * as React from "react";

export type Network = "testnet" | "mainnet";

const STORAGE_KEY = "forge:network";

interface NetworkContextValue {
  network: Network;
  setNetwork: (network: Network) => void;
}

const NetworkContext = React.createContext<NetworkContextValue | null>(null);

// Controls which chain the entire app talks to. All hooks (useJobs,
// useReputation, usePayments) and API calls pass the active network as a
// ?network= query param so the backend filters Supabase data and uses the
// correct contract addresses per chain.
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
