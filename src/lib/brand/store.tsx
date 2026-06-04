"use client";

// Multi-tenant brand context. Holds three demo client businesses so the app can
// be shown as different clients (simulating "log in with the client's FB
// account"). The active tenant's profile + brand kit drive Studio, the header,
// Content Intelligence and Settings. Edits persist to localStorage per tenant.
// In production each tenant is a Postgres row hydrated from the connected Page.
import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { demoTenants } from "@/lib/demo/data";
import { guessBusinessType } from "@/lib/demo/tenantData";
import type { BusinessProfile, BrandKit } from "@/lib/types";

export type Brand = { profile: BusinessProfile; kit: BrandKit };
type TenantMap = Record<string, Brand>;

const STORAGE_KEY = "sp_brand";
export const TENANT_COOKIE = "sp_tenant";

// Mirror the active tenant into a cookie so SERVER pages (posts/analytics/etc.)
// can pick the right per-client dataset.
function writeTenantCookie(id: string) {
  try {
    document.cookie = `${TENANT_COOKIE}=${id}; path=/; max-age=${60 * 60 * 24 * 60}; samesite=lax`;
  } catch {
    /* ignore */
  }
}

const DEFAULT_TENANTS: TenantMap = Object.fromEntries(
  demoTenants.map((t) => [t.id, { profile: t.profile, kit: t.kit }])
);
const DEFAULT_ID = demoTenants[0].id;

type Persisted = { tenantId: string; tenants: TenantMap };

function loadPersisted(): Persisted {
  return { tenantId: DEFAULT_ID, tenants: structuredCloneSafe(DEFAULT_TENANTS) };
}

// Avoid a hard structuredClone dependency in older runtimes.
function structuredCloneSafe<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

// Read the persisted active tenant id without React (used by the login screen,
// which lives outside the provider).
export function setActiveTenantId(id: string) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const state: Persisted = raw ? JSON.parse(raw) : loadPersisted();
    if (!state.tenants?.[id]) return;
    state.tenantId = id;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    writeTenantCookie(id);
  } catch {
    /* ignore */
  }
}

export const tenantList = demoTenants.map((t) => ({
  id: t.id,
  name: t.profile.name,
  type: t.profile.type,
}));

type Ctx = {
  brand: Brand;
  profile: BusinessProfile;
  kit: BrandKit;
  tenantId: string;
  tenants: { id: string; name: string; type: string }[];
  setProfile: (p: Partial<BusinessProfile>) => void;
  setKit: (k: Partial<BrandKit>) => void;
  switchTenant: (id: string) => void;
};

const BrandContext = createContext<Ctx | null>(null);

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  // Start from defaults so server & first client render match; hydrate after mount.
  const [state, setState] = useState<Persisted>(loadPersisted);

  useEffect(() => {
    (async () => {
      // 1) Base identity from localStorage (or defaults).
      let base: Persisted = loadPersisted();
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const saved = raw ? JSON.parse(raw) : null;
        if (saved?.tenants) {
          const tenants: TenantMap = { ...DEFAULT_TENANTS };
          for (const id of Object.keys(saved.tenants)) {
            tenants[id] = {
              profile: { ...DEFAULT_TENANTS[id]?.profile, ...saved.tenants[id]?.profile },
              kit: { ...DEFAULT_TENANTS[id]?.kit, ...saved.tenants[id]?.kit },
            } as Brand;
          }
          base = { tenantId: tenants[saved.tenantId] ? saved.tenantId : DEFAULT_ID, tenants };
        } else if (saved?.profile) {
          const tenants = structuredCloneSafe(DEFAULT_TENANTS);
          tenants[DEFAULT_ID] = {
            profile: { ...tenants[DEFAULT_ID].profile, ...saved.profile },
            kit: { ...tenants[DEFAULT_ID].kit, ...saved.kit },
          };
          base = { tenantId: DEFAULT_ID, tenants };
        }
      } catch {
        /* ignore corrupt storage */
      }

      // 2) If a real Facebook Page is connected, overlay its identity (name, logo,
      //    business type) so the whole app reflects the live client, not demo data.
      try {
        const s = await fetch("/api/fb/status", { cache: "no-store" }).then((r) => r.json());
        if (s?.connected && s.activePage) {
          const id = base.tenantId;
          const t = guessBusinessType(`${s.activePage.name} ${s.activePage.category ?? ""}`);
          base = {
            ...base,
            tenants: {
              ...base.tenants,
              [id]: {
                profile: { ...base.tenants[id].profile, name: s.activePage.name, ...(t ? { type: t } : {}) },
                kit: { ...base.tenants[id].kit, logo: s.activePage.picture ?? base.tenants[id].kit.logo },
              },
            },
          };
        }
      } catch {
        /* not connected — keep base */
      }

      setState(base);
      writeTenantCookie(base.tenantId);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(base));
      } catch {
        /* ignore */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function persist(next: Persisted) {
    setState(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable — keep in memory */
    }
  }

  const brand = state.tenants[state.tenantId] ?? DEFAULT_TENANTS[DEFAULT_ID];

  const value: Ctx = {
    brand,
    profile: brand.profile,
    kit: brand.kit,
    tenantId: state.tenantId,
    tenants: tenantList,
    setProfile: (p) =>
      persist({
        ...state,
        tenants: { ...state.tenants, [state.tenantId]: { ...brand, profile: { ...brand.profile, ...p } } },
      }),
    setKit: (k) =>
      persist({
        ...state,
        tenants: { ...state.tenants, [state.tenantId]: { ...brand, kit: { ...brand.kit, ...k } } },
      }),
    switchTenant: (id) => {
      if (state.tenants[id]) {
        persist({ ...state, tenantId: id });
        writeTenantCookie(id);
        router.refresh(); // re-render server pages with the new client's data
      }
    },
  };

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

export function useBrand() {
  const ctx = useContext(BrandContext);
  if (!ctx) throw new Error("useBrand must be used within BrandProvider");
  return ctx;
}
