import { api } from "@/lib/api-client";
import type {
  AdminCinema,
  AdminRoom,
  AdminShowtime,
  AdminShowtimeQuery,
  AdminStats,
  CinemaInput,
  Id,
  Movie,
  MovieInput,
  PosterUploadResult,
  RoomInput,
  RoomUpdate,
  ShowtimeInput,
} from "@/types/api";

// Toàn bộ endpoint /admin/* là FE đề xuất (backend chưa có), cần role ADMIN.
export const adminApi = {
  // TODO: khớp endpoint với backend — GET /admin/stats
  stats: () => api.get<AdminStats>("/admin/stats").then((r) => r.data),

  // ---- Phim ----
  // TODO: khớp endpoint với backend — GET /admin/movies
  movies: () => api.get<Movie[]>("/admin/movies").then((r) => r.data),
  // TODO: khớp endpoint với backend — POST /admin/movies
  createMovie: (input: MovieInput) => api.post<Movie>("/admin/movies", input).then((r) => r.data),
  // TODO: khớp endpoint với backend — PUT /admin/movies/{id}
  updateMovie: (id: Id, input: MovieInput) => api.put<Movie>(`/admin/movies/${id}`, input).then((r) => r.data),
  // TODO: khớp endpoint với backend — DELETE /admin/movies/{id} (409 nếu phim đã có suất chiếu)
  deleteMovie: (id: Id) => api.delete<void>(`/admin/movies/${id}`).then(() => undefined),
  // TODO: khớp endpoint với backend — POST /admin/uploads/poster (multipart, field "file") -> { posterKey }
  uploadPoster: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api
      .post<PosterUploadResult>("/admin/uploads/poster", form, { headers: { "Content-Type": "multipart/form-data" } })
      .then((r) => r.data);
  },

  // ---- Rạp ----
  // TODO: khớp endpoint với backend — GET /admin/cinemas (gồm cả rạp đã vô hiệu hoá)
  cinemas: () => api.get<AdminCinema[]>("/admin/cinemas").then((r) => r.data),
  // TODO: khớp endpoint với backend — POST /admin/cinemas
  createCinema: (input: CinemaInput) => api.post<AdminCinema>("/admin/cinemas", input).then((r) => r.data),
  // TODO: khớp endpoint với backend — PUT /admin/cinemas/{id}
  updateCinema: (id: Id, input: CinemaInput) => api.put<AdminCinema>(`/admin/cinemas/${id}`, input).then((r) => r.data),
  // TODO: khớp endpoint với backend — DELETE /admin/cinemas/{id} (soft delete: isActive=false)
  deactivateCinema: (id: Id) => api.delete<void>(`/admin/cinemas/${id}`).then(() => undefined),

  // ---- Phòng ----
  // TODO: khớp endpoint với backend — GET /admin/cinemas/{id}/rooms
  rooms: (cinemaId: Id) => api.get<AdminRoom[]>(`/admin/cinemas/${cinemaId}/rooms`).then((r) => r.data),
  // TODO: khớp endpoint với backend — POST /admin/cinemas/{id}/rooms (backend sinh ghế theo layout)
  createRoom: (cinemaId: Id, input: RoomInput) =>
    api.post<AdminRoom>(`/admin/cinemas/${cinemaId}/rooms`, input).then((r) => r.data),
  // TODO: khớp endpoint với backend — PATCH /admin/rooms/{id} (đổi tên / bật lại)
  updateRoom: (id: Id, input: RoomUpdate) => api.patch<AdminRoom>(`/admin/rooms/${id}`, input).then((r) => r.data),
  // TODO: khớp endpoint với backend — DELETE /admin/rooms/{id} (soft delete: isActive=false)
  deactivateRoom: (id: Id) => api.delete<void>(`/admin/rooms/${id}`).then(() => undefined),

  // ---- Suất chiếu ----
  // TODO: khớp endpoint với backend — GET /admin/showtimes?cinemaId=&date=YYYY-MM-DD&movieId=
  showtimes: (q: AdminShowtimeQuery) => api.get<AdminShowtime[]>("/admin/showtimes", { params: q }).then((r) => r.data),
  // TODO: khớp endpoint với backend — POST /admin/showtimes (409 nếu trùng giờ trong phòng; backend sinh showtime_seat + giá)
  createShowtime: (input: ShowtimeInput) => api.post<AdminShowtime>("/admin/showtimes", input).then((r) => r.data),
  // TODO: khớp endpoint với backend — DELETE /admin/showtimes/{id} (409 nếu đã có ghế bán)
  deleteShowtime: (id: Id) => api.delete<void>(`/admin/showtimes/${id}`).then(() => undefined),
};
