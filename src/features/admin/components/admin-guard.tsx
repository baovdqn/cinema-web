"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { useHydrated } from "@/lib/use-hydrated";
import { Spinner } from "@/components/ui/spinner";

/** Chỉ cho ADMIN. Chờ zustand hydrate rồi mới check; chưa đăng nhập -> /login?redirect=. */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const hydrated = useHydrated();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (hydrated && !token) router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
  }, [hydrated, token, router, pathname]);

  if (!hydrated || !token)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );

  if (user?.role !== "ADMIN")
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <p className="text-5xl font-bold text-red-500">403</p>
        <h1 className="mt-3 text-xl font-semibold">Bạn không có quyền truy cập</h1>
        <p className="mt-1 text-sm text-neutral-400">Khu vực này chỉ dành cho quản trị viên.</p>
        <Link href="/" className="mt-6 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500">
          Về trang chủ
        </Link>
      </div>
    );

  return <>{children}</>;
}
