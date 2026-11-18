"use client";

import { useQuery } from "@tanstack/react-query";
import { showtimesApi } from "./api";

export const showtimeKeys = {
  byMovie: (movieId: string, date?: string) => ["showtimes", "movie", movieId, date] as const,
  detail: (id: string) => ["showtimes", "detail", id] as const,
  seats: (id: string) => ["showtimes", "seats", id] as const,
};

export function useShowtimesByMovie(movieId: string, date?: string) {
  return useQuery({
    queryKey: showtimeKeys.byMovie(movieId, date),
    queryFn: () => showtimesApi.byMovie(movieId, date),
    enabled: !!movieId,
  });
}

export function useShowtime(id: string) {
  return useQuery({ queryKey: showtimeKeys.detail(id), queryFn: () => showtimesApi.detail(id) });
}

/** Sơ đồ ghế — poll 10s để cập nhật ghế người khác vừa giữ. */
export function useSeats(showtimeId: string) {
  return useQuery({
    queryKey: showtimeKeys.seats(showtimeId),
    queryFn: () => showtimesApi.seats(showtimeId),
    refetchInterval: 10_000,
    staleTime: 0,
  });
}
