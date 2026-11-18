"use client";

import Link from "next/link";
import { useAuthStore } from "@/stores/auth-store";
import { useHydrated } from "@/lib/use-hydrated";
import { UserMenu } from "./user-menu";

export function Header() {
  const hydrated = useHydrated();
  const user = useAuthStore((s) => s.user);
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
        <Link href="/" className="text-lg font-bold text-red-500">
          CinemaX
        </Link>
        <nav className="flex items-center gap-3 text-sm sm:gap-5">
          <Link href="/movies" className="hover:text-red-400">
            Phim
          </Link>
          {/* Chỗ cố định kích thước để tránh nhảy layout trước khi hydrate */}
          <div className="flex h-9 min-w-[5.5rem] items-center justify-end">
            {!hydrated ? null : user ? (
              <UserMenu />
            ) : (
              <Link
                href="/login"
                className="rounded-md bg-red-600 px-3 py-1.5 font-medium text-white hover:bg-red-500"
              >
                Đăng nhập
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
