"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useShowtimesByMovie } from "@/features/showtimes/hooks";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatShowtime, isSalesClosed } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { Cinema, Showtime } from "@/types/api";

interface CinemaGroup {
  cinema: Cinema;
  rooms: { roomId: number; roomName: string; showtimes: Showtime[] }[];
}

function groupByCinema(list: Showtime[]): CinemaGroup[] {
  const sorted = [...list].sort((a, b) => a.startTime.localeCompare(b.startTime));
  const groups = new Map<number, CinemaGroup>();
  for (const s of sorted) {
    let g = groups.get(s.cinema.id);
    if (!g) groups.set(s.cinema.id, (g = { cinema: s.cinema, rooms: [] }));
    let r = g.rooms.find((x) => x.roomId === s.room.id);
    if (!r) g.rooms.push((r = { roomId: s.room.id, roomName: s.room.name, showtimes: [] }));
    r.showtimes.push(s);
  }
  return [...groups.values()].sort((a, b) => a.cinema.name.localeCompare(b.cinema.name, "vi"));
}

export function ShowtimePicker({ movieId, date }: { movieId: string; date: string }) {
  const { data, isLoading, error, refetch } = useShowtimesByMovie(movieId, date);
  const groups = useMemo(() => groupByCinema(data ?? []), [data]);

  if (isLoading)
    return (
      <div className="space-y-4" aria-busy="true">
        {[0, 1].map((i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (groups.length === 0) return <EmptyState title="Không có suất chiếu trong ngày này" />;

  return (
    <div className="space-y-4">
      {groups.map(({ cinema, rooms }) => (
        <div key={cinema.id} className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <h3 className="font-semibold">{cinema.name}</h3>
          <p className="text-sm text-neutral-400">
            {cinema.address}, {cinema.city}
          </p>
          <div className="mt-3 space-y-3">
            {rooms.map((room) => (
              <div key={room.roomId} className="flex flex-wrap items-center gap-2">
                <span className="w-20 shrink-0 text-sm text-neutral-400">{room.roomName}</span>
                {room.showtimes.map((s) => {
                  const closed = isSalesClosed(s.startTime);
                  const cls = cn(
                    "rounded-md border px-3 py-1.5 text-sm font-medium tabular-nums transition",
                    closed
                      ? "cursor-not-allowed border-neutral-800 text-neutral-600"
                      : "border-neutral-600 hover:border-red-500 hover:bg-red-600 hover:text-white",
                  );
                  return closed ? (
                    <span key={s.id} className={cls} title="Đã đóng bán" aria-disabled="true">
                      {formatShowtime(s.startTime)}
                    </span>
                  ) : (
                    <Link key={s.id} href={`/showtimes/${s.id}/seats`} className={cls}>
                      {formatShowtime(s.startTime)}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
