import { api } from "@/lib/api-client";
import type { Seat, Showtime } from "@/types/api";

// TODO: khớp endpoint với backend
export const showtimesApi = {
  byMovie: (movieId: string, date?: string) =>
    api.get<Showtime[]>(`/movies/${movieId}/showtimes`, { params: { date } }).then((r) => r.data),
  detail: (id: string) => api.get<Showtime>(`/showtimes/${id}`).then((r) => r.data),
  seats: (id: string) => api.get<Seat[]>(`/showtimes/${id}/seats`).then((r) => r.data),
};
