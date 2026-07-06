// Back-compat shim. Real session logic now lives in src/lib/session.ts.
// Server-only (do not import from client components).
export {
  SESSION_COOKIE,
  setSessionCookie,
  clearSessionCookie,
  getSessionTenantId,
} from "@/lib/session";
