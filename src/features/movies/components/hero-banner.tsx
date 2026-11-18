import Link from "next/link";
import type { Movie } from "@/types/api";
import { Poster } from "@/components/ui/poster";
import { formatDate } from "@/lib/date";
import { StatusBadge } from "./status-badge";

export function HeroBanner({ movie }: { movie: Movie }) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
      <Poster
        posterKey={movie.posterKey}
        alt=""
        className="absolute inset-0 h-full w-full scale-110 opacity-40 blur-sm"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/80 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 to-transparent" />
      <div className="relative flex items-center gap-6 p-5 sm:p-8 md:p-10">
        <Poster
          posterKey={movie.posterKey}
          alt={movie.title}
          className="hidden aspect-[2/3] w-32 shrink-0 rounded-lg shadow-2xl sm:block md:w-44"
        />
        <div className="min-w-0 py-6 sm:py-4">
          <StatusBadge status={movie.status} />
          <h1 className="mt-3 text-2xl font-bold leading-tight sm:text-4xl">{movie.title}</h1>
          <p className="mt-2 text-sm text-neutral-300">
            {movie.durationMinutes} phút · Khởi chiếu {formatDate(movie.releaseDate)}
          </p>
          <Link
            href={`/movies/${movie.id}`}
            className="mt-5 inline-flex rounded-md bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-500"
          >
            Đặt vé
          </Link>
        </div>
      </div>
    </section>
  );
}
