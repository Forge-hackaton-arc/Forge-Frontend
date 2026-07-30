// Fixture data shaped exactly like the real API responses (lib/types.ts), used
// while NEXT_PUBLIC_USE_MOCKS=true or as a clearly-labeled fallback if a live
// fetch fails. Per the Forge PRD's non-functional requirements, nothing here is
// ever presented as live — see components/common/data-source-banner.tsx and the
// `source` field every lib/api.ts reader returns.

import type { JobListItem, ReputationEntry, NanoPaymentResponse } from "./types";

export const MOCK_AGENTS = [
  { agentId: "1", walletAddress: "0x5ead0a430c89424909967ba23fd29f16d39563ff", label: "summarizer-01" },
  { agentId: "2", walletAddress: "0x91aa2c9e1d4b7f6a3c8e0d5f2b1a9c7e6d4f0c0c", label: "fact-checker-01" },
  { agentId: "3", walletAddress: "0xcf06a61700b1ea8eae6a87148473f4efec36088e", label: "client-desk-01" },
  { agentId: "4", walletAddress: "0xa27e4b1c9f3d8e2a6b0c5d9f1e7a3b8c2d6e0f4a", label: "logo-gen-01" },
];

export const MOCK_JOBS: JobListItem[] = [
  {
    jobId: "1042",
    description: "Write a 200-word summary of Arc's stablecoin settlement model with 3 cited facts.",
    budget: "5.00",
    status: "Open",
    providerAgentId: "0x5ead0a430c89424909967ba23fd29f16d39563ff",
    createdAt: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
  },
  {
    jobId: "1041",
    description: "Write a 200-word summary of ERC-8004 identity registries with 3 cited facts.",
    budget: "12.00",
    status: "Funded",
    providerAgentId: "0x91aa2c9e1d4b7f6a3c8e0d5f2b1a9c7e6d4f0c0c",
    createdAt: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
  },
  {
    jobId: "1039",
    description: "Write a 200-word summary of x402 nanopayments with 3 cited facts.",
    budget: "8.00",
    status: "Submitted",
    providerAgentId: "0xa27e4b1c9f3d8e2a6b0c5d9f1e7a3b8c2d6e0f4a",
    createdAt: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
  },
  {
    jobId: "1033",
    description: "Write a 200-word summary of Circle developer-controlled wallets with 3 cited facts.",
    budget: "6.50",
    status: "Completed",
    providerAgentId: "0x5ead0a430c89424909967ba23fd29f16d39563ff",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    jobId: "1031",
    description: "Write a 200-word summary of the ERC-8183 job escrow lifecycle with 3 cited facts.",
    budget: "4.00",
    status: "Completed",
    providerAgentId: "0x91aa2c9e1d4b7f6a3c8e0d5f2b1a9c7e6d4f0c0c",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    jobId: "1028",
    description: "Write a 200-word summary of Groq inference latency with 3 cited facts.",
    budget: "3.00",
    status: "Rejected",
    providerAgentId: "0xa27e4b1c9f3d8e2a6b0c5d9f1e7a3b8c2d6e0f4a",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 9).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
  {
    jobId: "1019",
    description: "Write a 200-word summary of USDC as a native Arc system contract with 3 cited facts.",
    budget: "5.00",
    status: "Expired",
    providerAgentId: "0x5ead0a430c89424909967ba23fd29f16d39563ff",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  },
];

export const MOCK_REPUTATION: ReputationEntry[] = [
  { agentId: "1", walletAddress: "0x5ead0a430c89424909967ba23fd29f16d39563ff", score: 94, jobsCompleted: 12 },
  { agentId: "2", walletAddress: "0x91aa2c9e1d4b7f6a3c8e0d5f2b1a9c7e6d4f0c0c", score: 88, jobsCompleted: 9 },
  { agentId: "4", walletAddress: "0xa27e4b1c9f3d8e2a6b0c5d9f1e7a3b8c2d6e0f4a", score: 76, jobsCompleted: 5 },
];

export interface MockPaymentEvent extends NanoPaymentResponse {
  fromAgentId: string;
  toAgentId: string;
  reason: string;
}

export const MOCK_PAYMENTS: MockPaymentEvent[] = [
  {
    fromAgentId: "0x5ead0a430c89424909967ba23fd29f16d39563ff",
    toAgentId: "0x91aa2c9e1d4b7f6a3c8e0d5f2b1a9c7e6d4f0c0c",
    amountUsdc: "0.001",
    reason: "fact-check pass",
    txHash: "0x71c9e2a4b8d6f0c3a5e7b9d1f2c4a6e8b0d2f4c6a8e0b2d4f6a8c0e2b4d6f8a0",
    settledAt: new Date(Date.now() - 1000 * 8).toISOString(),
  },
  {
    fromAgentId: "0xa27e4b1c9f3d8e2a6b0c5d9f1e7a3b8c2d6e0f4a",
    toAgentId: "0x5ead0a430c89424909967ba23fd29f16d39563ff",
    amountUsdc: "0.0025",
    reason: "formatting pass",
    txHash: "0x2b4d6f8a0c2e4b6d8f0a2c4e6b8d0f2a4c6e8b0d2f4a6c8e0b2d4f6a8c0e2b4d",
    settledAt: new Date(Date.now() - 1000 * 47).toISOString(),
  },
  {
    fromAgentId: "0x91aa2c9e1d4b7f6a3c8e0d5f2b1a9c7e6d4f0c0c",
    toAgentId: "0xa27e4b1c9f3d8e2a6b0c5d9f1e7a3b8c2d6e0f4a",
    amountUsdc: "0.0018",
    reason: "citation lookup",
    txHash: "0x9d0f2a4c6e8b0d2f4a6c8e0b2d4f6a8c0e2b4d6f8a0c2e4b6d8f0a2c4e6b8d0f",
    settledAt: new Date(Date.now() - 1000 * 130).toISOString(),
  },
];
