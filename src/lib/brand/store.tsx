"use client";

// Brand context for the logged-in tenant. Seeded from the DB on the server (see
// (app)/layout.tsx) and passed in as `initial`. Edits update the UI instantly and
// persist to Postgres via /api/profile. Single real tenant per session — the old
// multi-tenant demo switcher is kept as a harmless stub for API compatibility.
import { createContext, useContext, useState } from "react";
import type { BusinessProfile, BrandKit } from "@/lib/types";

export type Brand = { profile: BusinessProfile; kit: BrandKit };

export interface InitialBrand {
  tenantId: string;
  profile: BusinessProfile;
  kit: BrandKit;
}

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

async function persist(body: { profile?: Partial<BusinessProfile>; kit?: Partial<BrandKit> }) {
  try {
    await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    /* offline — UI already updated; will re-sync on next edit */
  }
}

export function BrandProvider({
  initial,
  children,
}: {
  initial: InitialBrand;
  children: React.ReactNode;
}) {
  const [brand, setBrand] = useState<Brand>({ profile: initial.profile, kit: initial.kit });

  const value: Ctx = {
    brand,
    profile: brand.profile,
    kit: brand.kit,
    tenantId: initial.tenantId,
    tenants: [{ id: initial.tenantId, name: brand.profile.name, type: brand.profile.type }],
    setProfile: (p) => {
      setBrand((b) => ({ ...b, profile: { ...b.profile, ...p } }));
      persist({ profile: p });
    },
    setKit: (k) => {
      setBrand((b) => ({ ...b, kit: { ...b.kit, ...k } }));
      persist({ kit: k });
    },
    switchTenant: () => {
      /* single real tenant per session — no-op */
    },
  };

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

export function useBrand() {
  const ctx = useContext(BrandContext);
  if (!ctx) throw new Error("useBrand must be used within BrandProvider");
  return ctx;
}
