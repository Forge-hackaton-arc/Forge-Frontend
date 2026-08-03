"use client";

import * as React from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { truncateAddress } from "@/lib/format";
import { explorerAddressUrl, explorerTxUrl } from "@/lib/constants";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Identicon } from "./identicon";

function isEthAddress(value: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

interface AddressPillProps {
  value: string;
  kind?: "address" | "tx";
  /** Set when this value came from a mocked/simulated response — never linked to the explorer. */
  isMock?: boolean;
  /** Suppress the explorer link even for valid addresses (e.g. agent IDs in payment feed that aren't wallet signers). */
  noExplorer?: boolean;
  className?: string;
}

export function AddressPill({ value, kind = "address", isMock = false, noExplorer = false, className }: AddressPillProps) {
  const [copied, setCopied] = React.useState(false);
  // Only link to the explorer if the value is a real 0x address (not a numeric agent token ID) and linking is allowed
  const canLink = !isMock && !noExplorer && (kind === "tx" ? value.startsWith("0x") : isEthAddress(value));
  const href = kind === "address" ? explorerAddressUrl(value) : explorerTxUrl(value);

  const copy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const body = (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border py-0.5 pl-0.5 pr-2 font-mono text-xs",
        "border-border text-foreground/90",
        className
      )}
    >
      {kind === "address" && <Identicon seed={value} size={16} />}
      {truncateAddress(value)}
      <button onClick={copy} className="opacity-60 transition-opacity hover:opacity-100" aria-label="Copy">
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      </button>
      {canLink && <ExternalLink className="h-3 w-3 opacity-40" />}
    </span>
  );

  if (!canLink) {
    return <span className="cursor-default">{body}</span>;
  }

  return (
    <a href={href} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
      {body}
    </a>
  );
}
