// Back-compat shim. Real session logic now lives in src/lib/session.ts.
// Server-only (do not import from client components).
export {
  SESSION_COOKIE,
  setSession,
  setActiveCenter,
  clearSessionCookie,
  getSession,
  getSessionUserId,
  getSessionTenantId,
} from "@/lib/session";
