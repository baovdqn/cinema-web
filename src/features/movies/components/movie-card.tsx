import Link from "next/link";
import type { Movie } from "@/types/api";
import { Poster } from "@/components/ui/poster";
import { formatDate } from "@/lib/date";

export function MovieCard({ movie }: { movie: Movie }) {
  return (
    <Link href={`/movies/${movie.id}`} className="group block">
      <div className="aspect-[2/3] overflow-hidden rounded-lg bg-neutral-800">
        <Poster
          posterKey={movie.posterKey}
          alt={movie.title}
          className="h-full w-full transition group-hover:scale-105"
        />
      </div>
      <h3 className="mt-2 line-clamp-2 font-semibold group-hover:text-red-400">{movie.title}</h3>
      <p className="text-sm text-neutral-400">
        {movie.durationMinutes} phút
        {movie.status === "COMING_SOON" && ` · ${formatDate(movie.releaseDate)}`}
      </p>
    </Link>
  );
}
