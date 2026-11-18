import { api } from "@/lib/api-client";
import type { Showtime, ShowtimeSeat } from "@/types/api";

// Theo backend docs/todo/2026-11-04-todo.md (Phase 1 Catalog — đang làm)
export const showtimesApi = {
  // TODO: khớp endpoint với backend — GET /showtimes?movieId=&date=YYYY-MM-DD
  byMovie: (movieId: string, date: string) =>
    api.get<Showtime[]>("/showtimes", { params: { movieId, date } }).then((r) => r.data),
  // TODO: khớp endpoint với backend — GET /showtimes/{id}
  detail: (id: string) => api.get<Showtime>(`/showtimes/${id}`).then((r) => r.data),
  // TODO: khớp endpoint với backend — GET /showtimes/{id}/seats
  seats: (id: string) => api.get<ShowtimeSeat[]>(`/showtimes/${id}/seats`).then((r) => r.data),
};
