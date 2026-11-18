"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";

export function UserMenu() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;
  const itemCls = "block w-full px-4 py-2 text-left text-sm hover:bg-neutral-800";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-9 items-center gap-2 rounded-md px-2 hover:bg-neutral-800"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-600 text-xs font-bold">
          {user.fullName.trim().charAt(0).toUpperCase()}
        </span>
        <span className="hidden max-w-32 truncate text-sm sm:inline">{user.fullName}</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900 py-1 shadow-xl"
        >
          <div className="border-b border-neutral-800 px-4 py-2">
            <p className="truncate text-sm font-medium">{user.fullName}</p>
            <p className="truncate text-xs text-neutral-400">{user.email}</p>
          </div>
          <Link href="/my-bookings" role="menuitem" className={itemCls} onClick={() => setOpen(false)}>
            Vé của tôi
          </Link>
          {user.role === "ADMIN" && (
            <Link href="/admin" role="menuitem" className={itemCls} onClick={() => setOpen(false)}>
              Quản trị
            </Link>
          )}
          <button
            role="menuitem"
            className={itemCls}
            onClick={() => {
              setOpen(false);
              logout();
              qc.clear();
              router.push("/");
            }}
          >
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}
