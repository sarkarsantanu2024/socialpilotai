// Lightweight demo auth. No backend — a single cookie flag gates the app
// routes (see src/middleware.ts). Swap setSession/clearSession for real
// session calls when wiring a backend; the rest of the UI stays the same.

export const SESSION_COOKIE = "sp_session";

// Credentials shown on the login screen so anyone can try the demo.
export const DEMO_CREDENTIALS = {
  email: "demo@socialpilot.ai",
  password: "demo1234",
};

const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function setSession() {
  document.cookie = `${SESSION_COOKIE}=1; path=/; max-age=${MAX_AGE}; samesite=lax`;
}

export function clearSession() {
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; samesite=lax`;
}

export function checkDemoLogin(email: string, password: string) {
  return (
    email.trim().toLowerCase() === DEMO_CREDENTIALS.email &&
    password === DEMO_CREDENTIALS.password
  );
}
