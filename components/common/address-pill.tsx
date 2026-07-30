"use client";

import * as React from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { truncateAddress } from "@/lib/format";
import { explorerAddressUrl, explorerTxUrl } from "@/lib/constants";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AddressPillProps {
  value: string;
  kind?: "address" | "tx";
  /** Set when this value came from a mocked/simulated response — never linked to the explorer. */
  isMock?: boolean;
  className?: string;
}

export function AddressPill({ value, kind = "address", isMock = false, className }: AddressPillProps) {
  const [copied, setCopied] = React.useState(false);
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
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-xs",
        isMock ? "border-dashed border-muted-foreground/40 text-muted-foreground" : "border-border text-foreground/90",
        className
      )}
    >
      {truncateAddress(value)}
      <button onClick={copy} className="opacity-60 transition-opacity hover:opacity-100" aria-label="Copy">
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      </button>
      {!isMock && <ExternalLink className="h-3 w-3 opacity-40" />}
    </span>
  );

  if (isMock) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-default">{body}</span>
          </TooltipTrigger>
          <TooltipContent>Simulated — not a real Arc Testnet {kind === "tx" ? "transaction" : "address"}.</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <a href={href} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
      {body}
    </a>
  );
}
