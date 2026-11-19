import type { Metadata } from "next";
import { Suspense } from "react";
import { MovieDetail } from "@/features/movies/components/movie-detail";
import { Skeleton } from "@/components/ui/skeleton";
import type { Movie } from "@/types/api";

const FALLBACK: Metadata = { title: "Chi tiết phim", description: "Xem thông tin phim và đặt vé tại CinemaX." };

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  // MSW chỉ chạy ở trình duyệt nên khi mock thì lần fetch này thất bại → dùng metadata mặc định.
  try {
    const backendUrl = process.env.BACKEND_URL ?? "http://localhost:8080";
    // TODO: khớp endpoint với backend (chưa có GET /movies/{id})
    const res = await fetch(`${backendUrl}/movies/${encodeURIComponent(id)}`, {
      signal: AbortSignal.timeout(2000),
      next: { revalidate: 300 },
    });
    if (!res.ok) return FALLBACK;
    const movie = (await res.json()) as Movie;
    if (!movie?.title) return FALLBACK;
    const description = `Đặt vé phim ${movie.title} (${movie.durationMinutes} phút) tại CinemaX.`;
    return {
      title: movie.title,
      description,
      openGraph: { title: movie.title, description, type: "website" },
    };
  } catch {
    return FALLBACK;
  }
}

export default async function MovieDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <MovieDetail id={id} />
    </Suspense>
  );
}
