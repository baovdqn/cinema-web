import { Suspense } from "react";
import { MovieDetail } from "@/features/movies/components/movie-detail";
import { Skeleton } from "@/components/ui/skeleton";

export default async function MovieDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <MovieDetail id={id} />
    </Suspense>
  );
}
