"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { movieKeys } from "@/features/movies/hooks";
import { showtimeKeys } from "@/features/showtimes/hooks";
import type { AdminShowtimeQuery, CinemaInput, Id, MovieInput, RoomInput, RoomUpdate, ShowtimeInput } from "@/types/api";
import { adminApi } from "./api";

export const adminKeys = {
  all: ["admin"] as const,
  stats: () => [...adminKeys.all, "stats"] as const,
  movies: () => [...adminKeys.all, "movies"] as const,
  cinemas: () => [...adminKeys.all, "cinemas"] as const,
  rooms: (cinemaId: Id) => [...adminKeys.all, "rooms", cinemaId] as const,
  roomsAll: () => [...adminKeys.all, "rooms"] as const,
  showtimesAll: () => [...adminKeys.all, "showtimes"] as const,
  showtimes: (q: AdminShowtimeQuery) => [...adminKeys.showtimesAll(), q] as const,
};

export function useAdminStats() {
  return useQuery({ queryKey: adminKeys.stats(), queryFn: adminApi.stats });
}
export function useAdminMovies() {
  return useQuery({ queryKey: adminKeys.movies(), queryFn: adminApi.movies });
}
export function useAdminCinemas() {
  return useQuery({ queryKey: adminKeys.cinemas(), queryFn: adminApi.cinemas });
}
export function useAdminRooms(cinemaId: Id) {
  return useQuery({ queryKey: adminKeys.rooms(cinemaId), queryFn: () => adminApi.rooms(cinemaId), enabled: cinemaId > 0 });
}
export function useAdminShowtimes(q: AdminShowtimeQuery) {
  return useQuery({ queryKey: adminKeys.showtimes(q), queryFn: () => adminApi.showtimes(q) });
}

/** Mỗi mutation làm mới cả cache admin lẫn cache trang khách liên quan. */
function useInvalidate() {
  const qc = useQueryClient();
  return {
    movies: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: adminKeys.movies() }),
        qc.invalidateQueries({ queryKey: adminKeys.stats() }),
        qc.invalidateQueries({ queryKey: movieKeys.all }),
        qc.invalidateQueries({ queryKey: adminKeys.showtimesAll() }),
      ]),
    cinemas: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: adminKeys.cinemas() }),
        qc.invalidateQueries({ queryKey: adminKeys.stats() }),
        qc.invalidateQueries({ queryKey: adminKeys.showtimesAll() }),
        qc.invalidateQueries({ queryKey: showtimeKeys.all }),
      ]),
    rooms: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: adminKeys.roomsAll() }),
        qc.invalidateQueries({ queryKey: adminKeys.cinemas() }),
        qc.invalidateQueries({ queryKey: adminKeys.showtimesAll() }),
        qc.invalidateQueries({ queryKey: showtimeKeys.all }),
      ]),
    showtimes: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: adminKeys.showtimesAll() }),
        qc.invalidateQueries({ queryKey: adminKeys.stats() }),
        qc.invalidateQueries({ queryKey: showtimeKeys.all }),
      ]),
  };
}

export function useUploadPoster() {
  return useMutation({ mutationFn: (file: File) => adminApi.uploadPoster(file) });
}
export function useCreateMovie() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: (input: MovieInput) => adminApi.createMovie(input), onSuccess: inv.movies });
}
export function useUpdateMovie() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: ({ id, input }: { id: Id; input: MovieInput }) => adminApi.updateMovie(id, input),
    onSuccess: inv.movies,
  });
}
export function useDeleteMovie() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: (id: Id) => adminApi.deleteMovie(id), onSuccess: inv.movies });
}

export function useCreateCinema() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: (input: CinemaInput) => adminApi.createCinema(input), onSuccess: inv.cinemas });
}
export function useUpdateCinema() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: ({ id, input }: { id: Id; input: CinemaInput }) => adminApi.updateCinema(id, input),
    onSuccess: inv.cinemas,
  });
}
export function useDeactivateCinema() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: (id: Id) => adminApi.deactivateCinema(id), onSuccess: inv.cinemas });
}

export function useCreateRoom(cinemaId: Id) {
  const inv = useInvalidate();
  return useMutation({ mutationFn: (input: RoomInput) => adminApi.createRoom(cinemaId, input), onSuccess: inv.rooms });
}
export function useUpdateRoom() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: ({ id, input }: { id: Id; input: RoomUpdate }) => adminApi.updateRoom(id, input),
    onSuccess: inv.rooms,
  });
}
export function useDeactivateRoom() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: (id: Id) => adminApi.deactivateRoom(id), onSuccess: inv.rooms });
}

export function useCreateShowtime() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: (input: ShowtimeInput) => adminApi.createShowtime(input), onSuccess: inv.showtimes });
}
export function useDeleteShowtime() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: (id: Id) => adminApi.deleteShowtime(id), onSuccess: inv.showtimes });
}
