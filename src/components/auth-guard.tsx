"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { useHydrated } from "@/lib/use-hydrated";
import { Spinner } from "@/components/ui/spinner";

/** Bọc các trang cần đăng nhập. Chờ zustand hydrate từ localStorage rồi mới check. */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.accessToken);
  const hydrated = useHydrated();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (hydrated && !token) router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
  }, [hydrated, token, router, pathname]);

  if (!hydrated || !token)
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  return <>{children}</>;
}
