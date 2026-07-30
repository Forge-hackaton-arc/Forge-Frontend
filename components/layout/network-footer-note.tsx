"use client";

import { useNetwork } from "@/providers/network-provider";

export function NetworkFooterNote() {
  const { network } = useNetwork();
  return (
    <span className="font-mono">
      {network === "mainnet" ? "Arc Mainnet · chain id 5042001" : "Arc Testnet · chain id 5042002"}
    </span>
  );
}
