import Link from "next/link";
import type { Movie } from "@/types/api";
import { getPosterUrl } from "@/lib/utils";

export function MovieCard({ movie }: { movie: Movie }) {
  return (
    <Link href={`/movies/${movie.id}`} className="group block">
      <div className="aspect-[2/3] overflow-hidden rounded-lg bg-neutral-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getPosterUrl(movie.posterKey)}
          alt={movie.title}
          className="h-full w-full object-cover transition group-hover:scale-105"
        />
      </div>
      <h3 className="mt-2 line-clamp-2 font-semibold">{movie.title}</h3>
      <p className="text-sm text-neutral-400">{movie.durationMinutes} phút</p>
    </Link>
  );
}
