"use client";

import { useMovies } from "@/features/movies/hooks";
import { MovieCard } from "@/features/movies/components/movie-card";
import { Spinner } from "@/components/ui/spinner";
import { getErrorMessage } from "@/lib/api-client";

// TODO (Phase 2): hero banner, tab Đang chiếu / Sắp chiếu
export default function HomePage() {
  const { data, isLoading, error } = useMovies({ status: "NOW_SHOWING", size: 12 });

  return (
    <section>
      <h1 className="mb-6 text-2xl font-bold">Phim đang chiếu</h1>
      {isLoading && <Spinner />}
      {error && <p className="text-red-400">{getErrorMessage(error)}</p>}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {data?.content.map((m) => <MovieCard key={m.id} movie={m} />)}
      </div>
    </section>
  );
}
