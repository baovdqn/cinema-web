import { api } from "@/lib/api-client";
import type { Movie, MovieStatus } from "@/types/api";

export interface MovieQuery {
  status?: MovieStatus;
}

export const moviesApi = {
  // ✅ Backend đã có: GET /movies -> List<Movie> (chưa filter/phân trang, đang lọc ở FE)
  list: (query: MovieQuery = {}) =>
    api
      .get<Movie[]>("/movies", { params: query })
      .then((r) => (query.status ? r.data.filter((m) => m.status === query.status) : r.data)),
  // TODO: khớp endpoint với backend (chưa có GET /movies/{id})
  detail: (id: string) => api.get<Movie>(`/movies/${id}`).then((r) => r.data),
};
