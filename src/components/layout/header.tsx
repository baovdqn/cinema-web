"use client";

import Link from "next/link";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";

export function Header() {
  const { user, logout } = useAuthStore();
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold text-red-500">
          CinemaX
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/movies">Phim</Link>
          {user ? (
            <>
              <Link href="/my-bookings">Vé của tôi</Link>
              <span className="text-neutral-400">{user.fullName}</span>
              <Button variant="ghost" onClick={logout}>
                Đăng xuất
              </Button>
            </>
          ) : (
            <Link href="/login">Đăng nhập</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
