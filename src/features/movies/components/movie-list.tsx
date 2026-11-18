"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMovies } from "@/features/movies/hooks";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MovieGrid, MovieGridSkeleton } from "./movie-grid";

const FILTERS = [
  { value: "", label: "Tất cả" },
  { value: "NOW_SHOWING", label: "Đang chiếu" },
  { value: "COMING_SOON", label: "Sắp chiếu" },
];

function normalize(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").toLowerCase().trim();
}

export function MovieList() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const urlQ = params.get("q") ?? "";
  const status = params.get("status") ?? "";

  const [text, setText] = useState(urlQ);
  const { data, isLoading, error, refetch } = useMovies({});

  // Debounce 300ms rồi ghi q lên URL (giữ nguyên status).
  useEffect(() => {
    if (text === urlQ) return;
    const t = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (text.trim()) next.set("q", text);
      else next.delete("q");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 300);
    return () => clearTimeout(t);
  }, [text, urlQ, params, pathname, router]);

  function setStatus(value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set("status", value);
    else next.delete("status");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const q = normalize(urlQ);
  const filtered = (data ?? []).filter(
    (m) => (!status || m.status === status) && (!q || normalize(m.title).includes(q)),
  );

  return (
    <section>
      <h1 className="mb-4 text-2xl font-bold">Tất cả phim</h1>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Tìm phim theo tên..."
          aria-label="Tìm phim theo tên"
          className="sm:max-w-xs"
        />
        <div className="flex gap-2 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatus(f.value)}
              aria-pressed={status === f.value}
              className={cn(
                "shrink-0 rounded-full border px-4 py-1.5 text-sm transition",
                status === f.value
                  ? "border-red-600 bg-red-600 text-white"
                  : "border-neutral-700 text-neutral-300 hover:border-neutral-500",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      {isLoading ? (
        <MovieGridSkeleton />
      ) : error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState title="Không tìm thấy phim phù hợp" description="Thử đổi từ khoá hoặc bộ lọc khác." />
      ) : (
        <MovieGrid movies={filtered} />
      )}
    </section>
  );
}
