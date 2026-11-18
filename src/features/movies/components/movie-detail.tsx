"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMovie } from "@/features/movies/hooks";
import { ShowtimePicker } from "@/features/showtimes/components/showtime-picker";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Poster } from "@/components/ui/poster";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorStatus } from "@/lib/api-client";
import { formatDate, next7Days } from "@/lib/date";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./status-badge";

export function MovieDetail({ id }: { id: string }) {
  const { data: movie, isLoading, error, refetch } = useMovie(id);
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const days = next7Days();
  const dateParam = params.get("date");
  const date = days.some((d) => d.value === dateParam) ? dateParam! : days[0].value;

  if (isLoading)
    return (
      <div className="flex flex-col gap-6 sm:flex-row" aria-busy="true">
        <Skeleton className="aspect-[2/3] w-40 shrink-0 sm:w-56" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );

  if (getErrorStatus(error) === 404)
    return (
      <EmptyState
        title="Không tìm thấy phim"
        description="Phim không tồn tại hoặc đã bị gỡ."
        action={
          <Link href="/movies" className="text-red-400 hover:underline">
            Quay lại danh sách phim
          </Link>
        }
      />
    );
  if (error || !movie) return <ErrorState error={error} onRetry={() => refetch()} />;

  function selectDate(value: string) {
    const next = new URLSearchParams(params.toString());
    next.set("date", value);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  return (
    <div>
      <div className="flex flex-col gap-6 sm:flex-row">
        <Poster
          posterKey={movie.posterKey}
          alt={movie.title}
          className="aspect-[2/3] w-40 shrink-0 rounded-xl shadow-xl sm:w-56"
        />
        <div className="min-w-0">
          <StatusBadge status={movie.status} />
          <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{movie.title}</h1>
          <dl className="mt-4 space-y-1 text-sm">
            <div className="flex gap-2">
              <dt className="w-24 text-neutral-400">Thời lượng</dt>
              <dd>{movie.durationMinutes} phút</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-24 text-neutral-400">Khởi chiếu</dt>
              <dd>{formatDate(movie.releaseDate)}</dd>
            </div>
          </dl>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-xl font-bold">Lịch chiếu</h2>
        {movie.status === "NOW_SHOWING" ? (
          <>
            <div className="mb-5 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Chọn ngày">
              {days.map((d) => (
                <button
                  key={d.value}
                  role="tab"
                  aria-selected={d.value === date}
                  onClick={() => selectDate(d.value)}
                  className={cn(
                    "shrink-0 rounded-lg border px-4 py-2 text-center text-sm transition",
                    d.value === date
                      ? "border-red-600 bg-red-600 text-white"
                      : "border-neutral-700 text-neutral-300 hover:border-neutral-500",
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <ShowtimePicker movieId={id} date={date} />
          </>
        ) : movie.status === "COMING_SOON" ? (
          <EmptyState
            title="Sắp chiếu"
            description={`Phim khởi chiếu từ ${formatDate(movie.releaseDate)}. Lịch chiếu sẽ được cập nhật sau.`}
          />
        ) : (
          <EmptyState title="Phim đã kết thúc chiếu" />
        )}
      </section>
    </div>
  );
}
