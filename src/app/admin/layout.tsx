import type { Metadata } from "next";
import { AdminGuard } from "@/features/admin/components/admin-guard";
import { AdminShell } from "@/features/admin/components/admin-shell";

export const metadata: Metadata = { title: "Quản trị", robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <AdminShell>{children}</AdminShell>
    </AdminGuard>
  );
}
