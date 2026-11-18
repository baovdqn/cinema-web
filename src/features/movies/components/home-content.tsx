"use client";

import { useState } from "react";
import { useMovies } from "@/features/movies/hooks";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { MovieStatus } from "@/types/api";
import { HeroBanner } from "./hero-banner";
import { MovieGrid, MovieGridSkeleton } from "./movie-grid";

const TABS: { status: MovieStatus; label: string }[] = [
  { status: "NOW_SHOWING", label: "Đang chiếu" },
  { status: "COMING_SOON", label: "Sắp chiếu" },
];

export function HomeContent() {
  const [tab, setTab] = useState<MovieStatus>("NOW_SHOWING");
  const { data, isLoading, error, refetch } = useMovies({});

  const featured = data?.find((m) => m.status === "NOW_SHOWING");
  const list = data?.filter((m) => m.status === tab) ?? [];

  return (
    <div className="space-y-8">
      {isLoading ? <Skeleton className="h-64 w-full rounded-2xl sm:h-72" /> : featured && <HeroBanner movie={featured} />}

      <section>
        <div role="tablist" className="mb-5 flex gap-6 border-b border-neutral-800">
          {TABS.map((t) => (
            <button
              key={t.status}
              role="tab"
              aria-selected={tab === t.status}
              onClick={() => setTab(t.status)}
              className={cn(
                "-mb-px border-b-2 pb-2 text-lg font-semibold transition",
                tab === t.status
                  ? "border-red-600 text-white"
                  : "border-transparent text-neutral-500 hover:text-neutral-300",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        {isLoading ? (
          <MovieGridSkeleton />
        ) : error ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : list.length === 0 ? (
          <EmptyState title="Chưa có phim nào" />
        ) : (
          <MovieGrid movies={list} />
        )}
      </section>
    </div>
  );
}
