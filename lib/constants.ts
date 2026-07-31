import type { JobStatus } from "./types";

// The single MVP job type per the Forge PRD (§6): one fixed task shape, not an
// open multi-domain job board. The client only ever supplies a topic; the
// description sent to the API is composed from this template so every job in
// the system is the same, gradeable shape the Groq validator expects.
export const JOB_TEMPLATE = {
  label: "Summary + citations",
  instructions: (topic: string) =>
    `Write a 200-word summary of ${topic} with 3 cited facts.`,
  criteria: [
    "~200 words",
    "3 distinguishable, on-topic factual claims",
    "relevant to the stated topic",
  ],
};

// Left-to-right pipeline order for the kanban board. Rejected/Expired are
// terminal edge cases, kept at the end rather than mixed into the happy path.
export const JOB_STATUS_ORDER: JobStatus[] = [
  "Open",
  "Funded",
  "Submitted",
  "Completed",
  "Rejected",
  "Expired",
];

export const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  Open: "Open",
  Funded: "Funded",
  Submitted: "Submitted",
  Completed: "Completed",
  Rejected: "Rejected",
  Expired: "Expired",
};

// Tailwind class tokens keyed to the status.* palette defined in globals.css —
// kept in one place so badges, kanban headers, and detail views never drift.
export const JOB_STATUS_COLOR_VAR: Record<JobStatus, string> = {
  Open: "--status-open",
  Funded: "--status-funded",
  Submitted: "--status-submitted",
  Completed: "--status-completed",
  Rejected: "--status-rejected",
  Expired: "--status-expired",
};

export const JOB_STATUS_DESCRIPTION: Record<JobStatus, string> = {
  Open: "Posted onchain, awaiting escrow funding.",
  Funded: "Escrow funded. The provider can begin the work.",
  Submitted: "Deliverable submitted, awaiting Groq validation.",
  Completed: "Validated, escrow released, reputation written onchain.",
  Rejected: "Validation failed the scoring threshold.",
  Expired: "Job expired before completion.",
};

export const ARC_EXPLORER_BASE_URL =
  process.env.NEXT_PUBLIC_ARC_EXPLORER_BASE_URL ?? "https://testnet.arcscan.app";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS !== "false";

// Contracts confirmed in the Forge PRD (§9), deployed on Arc Testnet.
// ValidationRegistry is out of MVP scope but listed for completeness / explorer links.
export const CONTRACTS = {
  identityRegistry: "0x8004A818BFB912233c491871b3d84c89A494BD9e",
  reputationRegistry: "0x8004B663056A597Dffe9eCcC1965A193B7388713",
  validationRegistry: "0x8004Cb1BF31DAf7788923b405b754f57acEB4272",
  agenticCommerce: "0x0747EEf0706327138c69792bF28Cd525089e4583",
} as const;

export function explorerAddressUrl(address: string) {
  return `${ARC_EXPLORER_BASE_URL}/address/${address}`;
}

export function explorerTxUrl(txHash: string) {
  return `${ARC_EXPLORER_BASE_URL}/tx/${txHash}`;
}
