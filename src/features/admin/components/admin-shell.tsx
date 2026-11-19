"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Tổng quan", exact: true },
  { href: "/admin/movies", label: "Phim" },
  { href: "/admin/cinemas", label: "Rạp & phòng" },
  { href: "/admin/showtimes", label: "Suất chiếu" },
];

/** Sidebar trên desktop, thanh menu ngang cuộn được trên mobile. */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  const linkCls = (active: boolean) =>
    cn(
      "whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition",
      active ? "bg-red-600 text-white" : "text-neutral-300 hover:bg-neutral-800 hover:text-white",
    );

  return (
    <div className="min-h-screen md:flex">
      <aside className="border-b border-neutral-800 bg-neutral-900 md:sticky md:top-0 md:h-screen md:w-56 md:shrink-0 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between px-4 py-3 md:block md:py-5">
          <div>
            <Link href="/admin" className="text-lg font-bold text-red-500">
              CinemaX
            </Link>
            <span className="ml-2 text-xs uppercase tracking-wider text-neutral-400">Quản trị</span>
          </div>
          <p className="max-w-40 truncate text-xs text-neutral-500 md:mt-1 md:max-w-none">{user?.email}</p>
        </div>
        <nav aria-label="Menu quản trị" className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible md:pb-0">
          {NAV.map((n) => {
            const active = n.exact ? pathname === n.href : pathname.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} aria-current={active ? "page" : undefined} className={linkCls(active)}>
                {n.label}
              </Link>
            );
          })}
          <Link
            href="/"
            className="whitespace-nowrap rounded-md px-3 py-2 text-sm text-neutral-400 hover:bg-neutral-800 hover:text-white md:mt-6 md:border-t md:border-neutral-800"
          >
            ← Về trang khách
          </Link>
        </nav>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 md:px-8">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
