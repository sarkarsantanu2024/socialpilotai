// Process-scoped server store for things the webhook needs but a cookie can't
// hold (the webhook request has no user session). In production these live in
// Postgres (connected_pages.page_token, leads table). Fine for a single-process
// demo; resets on restart and isn't shared across serverless instances.
import type { Lead } from "@/lib/types";

type Store = {
  pageTokens: Map<string, string>; // pageId -> page access token
  leads: Map<string, Lead[]>; // pageId -> captured leads (newest first)
};

// Survive Next.js dev hot-reloads by stashing on globalThis.
const g = globalThis as unknown as { __spFbStore?: Store };
const store: Store = g.__spFbStore ?? { pageTokens: new Map(), leads: new Map() };
g.__spFbStore = store;

export function rememberPageToken(pageId: string, token: string) {
  store.pageTokens.set(pageId, token);
}

export function getPageToken(pageId: string): string | undefined {
  return store.pageTokens.get(pageId);
}

export function addLead(pageId: string, lead: Lead) {
  const list = store.leads.get(pageId) ?? [];
  store.leads.set(pageId, [lead, ...list]);
}

export function getCapturedLeads(pageId: string): Lead[] {
  return store.leads.get(pageId) ?? [];
}
