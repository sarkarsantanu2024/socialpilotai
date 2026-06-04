import { AppShell } from "@/components/layout/AppShell";
import { BrandProvider } from "@/lib/brand/store";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <BrandProvider>
      <AppShell>{children}</AppShell>
    </BrandProvider>
  );
}
