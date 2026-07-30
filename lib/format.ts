import { formatDistanceToNowStrict } from "date-fns";

export function truncateAddress(value: string, lead = 6, trail = 4) {
  if (!value) return "";
  if (value.length <= lead + trail + 3) return value;
  return `${value.slice(0, lead)}…${value.slice(-trail)}`;
}

export function formatUsdc(amount: string | number) {
  const n = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(n)) return `${amount} USDC`;
  return `${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} USDC`;
}

export function relativeTime(iso: string) {
  try {
    return `${formatDistanceToNowStrict(new Date(iso))} ago`;
  } catch {
    return iso;
  }
}

export function isValidAgentRef(value: string) {
  // Backend accepts either a raw wallet address or a numeric ERC-8004 token id
  // as an agent reference (see Forge-Backend/app/api/jobs/route.ts comment).
  return /^0x[a-fA-F0-9]{40}$/.test(value) || /^\d+$/.test(value);
}
