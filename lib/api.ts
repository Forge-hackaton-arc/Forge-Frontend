// Typed client for the Forge-Backend API (see Forge-Backend/app/api/**, whose
// lib/types.ts is copied verbatim into ./types.ts). Every function returns a
// `Sourced<T>` so callers — and the UI — always know whether a result is real
// ("live") or fixture/simulated data ("mock"). Per the PRD's non-functional
// requirements, mock results are never presented as if they were live: reads
// fall back to mocks silently-in-code but visibly-in-UI (see
// components/common/data-source-banner.tsx), and write actions that would
// otherwise fabricate a fake onchain result are tagged so tx hashes render as
// "simulated" rather than as clickable Arcscan links.

import { API_BASE_URL, USE_MOCKS } from "./constants";
import {
  MOCK_JOBS,
  MOCK_REPUTATION,
  MOCK_PAYMENTS,
  type MockPaymentEvent,
} from "./mock-data";
import type {
  ApiError,
  CreateJobRequest,
  CreateJobResponse,
  JobListItem,
  NanoPaymentRequest,
  NanoPaymentResponse,
  RegisterAgentRequest,
  RegisterAgentResponse,
  ReputationEntry,
  SubmitDeliverableRequest,
  SubmitDeliverableResponse,
  ValidateJobResponse,
} from "./types";

export type DataSource = "live" | "mock";
export interface Sourced<T> {
  data: T;
  source: DataSource;
}

export class ForgeApiError extends Error {
  detail?: string;
  status?: number;
  constructor(message: string, opts?: { detail?: string; status?: number }) {
    super(message);
    this.detail = opts?.detail;
    this.status = opts?.status;
  }
}

function randomHex(bytes: number) {
  let out = "0x";
  for (let i = 0; i < bytes * 2; i++) out += Math.floor(Math.random() * 16).toString(16);
  return out;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
      cache: "no-store",
    });
  } catch (err) {
    throw new ForgeApiError("Could not reach the Forge API", { detail: (err as Error).message });
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as Partial<ApiError>;
    throw new ForgeApiError(body.error ?? `Request failed (${res.status})`, {
      detail: body.detail,
      status: res.status,
    });
  }
  return res.json() as Promise<T>;
}

// ---- Reads: GET /api/jobs, GET /api/reputation ----------------------------
// Mocks-first (or fallback-on-failure), always tagged with `source`.

export async function fetchJobs(): Promise<Sourced<JobListItem[]>> {
  if (USE_MOCKS) return { data: MOCK_JOBS, source: "mock" };
  try {
    const data = await request<JobListItem[]>("/api/jobs");
    return { data, source: "live" };
  } catch {
    return { data: MOCK_JOBS, source: "mock" };
  }
}

export async function fetchReputation(): Promise<Sourced<ReputationEntry[]>> {
  if (USE_MOCKS) return { data: MOCK_REPUTATION, source: "mock" };
  try {
    const data = await request<ReputationEntry[]>("/api/reputation");
    return { data, source: "live" };
  } catch {
    return { data: MOCK_REPUTATION, source: "mock" };
  }
}

export function fetchMockPayments(): MockPaymentEvent[] {
  return MOCK_PAYMENTS;
}

// ---- Writes: every one mutates onchain state on the real backend ----------
// In mock mode these still "succeed" so the whole flow is click-through-able
// during frontend-only development, but the response is tagged `source:
// "mock"` so the UI never renders a fabricated hash as a real Arcscan link.

export async function registerAgent(
  req: RegisterAgentRequest
): Promise<Sourced<RegisterAgentResponse>> {
  if (USE_MOCKS) {
    await delay();
    return {
      data: { agentId: String(Math.floor(Math.random() * 900) + 100), walletAddress: randomHex(20), txHash: randomHex(32) },
      source: "mock",
    };
  }
  const data = await request<RegisterAgentResponse>("/api/agents/register", {
    method: "POST",
    body: JSON.stringify(req),
  });
  return { data, source: "live" };
}

export async function createJob(req: CreateJobRequest): Promise<Sourced<CreateJobResponse>> {
  if (USE_MOCKS) {
    await delay();
    return {
      data: { jobId: String(Math.floor(Math.random() * 900) + 1100), status: "Open", txHash: randomHex(32) },
      source: "mock",
    };
  }
  const data = await request<CreateJobResponse>("/api/jobs", {
    method: "POST",
    body: JSON.stringify(req),
  });
  return { data, source: "live" };
}

export async function submitDeliverable(
  jobId: string,
  req: SubmitDeliverableRequest
): Promise<Sourced<SubmitDeliverableResponse>> {
  if (USE_MOCKS) {
    await delay();
    return {
      data: { jobId, deliverableHash: randomHex(32), status: "Submitted", txHash: randomHex(32) },
      source: "mock",
    };
  }
  const data = await request<SubmitDeliverableResponse>(`/api/jobs/${jobId}/submit`, {
    method: "POST",
    body: JSON.stringify(req),
  });
  return { data, source: "live" };
}

export async function validateJob(jobId: string): Promise<Sourced<ValidateJobResponse>> {
  if (USE_MOCKS) {
    await delay(900);
    const score = 55 + Math.floor(Math.random() * 45);
    const passed = score >= 60;
    return {
      data: {
        jobId,
        passed,
        score,
        reasoning: passed
          ? "Summary is ~200 words, on-topic, and cites 3 distinguishable facts."
          : "Summary is off-topic or missing distinguishable cited facts.",
        completeTxHash: passed ? randomHex(32) : undefined,
        reputationTxHash: passed ? randomHex(32) : undefined,
        status: passed ? "Completed" : "Rejected",
      },
      source: "mock",
    };
  }
  const data = await request<ValidateJobResponse>(`/api/jobs/${jobId}/validate`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  return { data, source: "live" };
}

export async function sendNanoPayment(
  req: NanoPaymentRequest
): Promise<Sourced<NanoPaymentResponse>> {
  if (USE_MOCKS) {
    await delay();
    return {
      data: { txHash: randomHex(32), amountUsdc: req.amountUsdc, settledAt: new Date().toISOString() },
      source: "mock",
    };
  }
  const data = await request<NanoPaymentResponse>("/api/payments/nano", {
    method: "POST",
    body: JSON.stringify(req),
  });
  return { data, source: "live" };
}

function delay(ms = 500) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
