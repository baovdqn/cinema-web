import { Suspense } from "react";
import { MovieList } from "@/features/movies/components/movie-list";
import { MovieGridSkeleton } from "@/features/movies/components/movie-grid";

export default function MoviesPage() {
  return (
    <Suspense fallback={<MovieGridSkeleton />}>
      <MovieList />
    </Suspense>
  );
}
