// Lightweight "acting as" identity — NOT authentication. The backend has zero
// auth on any route (see Forge-Backend README, "Known simplifications"), so
// there is nothing real to authenticate against. This is purely a demo
// convenience: it lets one browser walk through all three roles in the job
// lifecycle (client creates, provider submits, evaluator validates) by
// remembering which agent you're "acting as" in localStorage, and is always
// labeled as such in the UI rather than implying real access control.

export interface StoredIdentity {
  agentId: string;
  walletAddress: string;
  label?: string;
  registeredAt: string;
}

const STORAGE_KEY = "forge:identities";
const ACTIVE_KEY = "forge:active-identity";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function getStoredIdentities(): StoredIdentity[] {
  if (typeof window === "undefined") return [];
  return safeParse<StoredIdentity[]>(window.localStorage.getItem(STORAGE_KEY), []);
}

export function saveIdentity(identity: StoredIdentity) {
  if (typeof window === "undefined") return;
  const existing = getStoredIdentities().filter((i) => i.agentId !== identity.agentId);
  const next = [identity, ...existing];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("forge:identities-changed"));
}

export function removeIdentity(agentId: string) {
  if (typeof window === "undefined") return;
  const next = getStoredIdentities().filter((i) => i.agentId !== agentId);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("forge:identities-changed"));
}

export function getActiveIdentityId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_KEY);
}

export function setActiveIdentityId(agentId: string | null) {
  if (typeof window === "undefined") return;
  if (agentId) window.localStorage.setItem(ACTIVE_KEY, agentId);
  else window.localStorage.removeItem(ACTIVE_KEY);
  window.dispatchEvent(new Event("forge:identities-changed"));
}
