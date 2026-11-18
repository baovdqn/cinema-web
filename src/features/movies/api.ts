import { api } from "@/lib/api-client";
import type { Movie, MovieStatus, Page } from "@/types/api";

export interface MovieQuery {
  status?: MovieStatus;
  keyword?: string;
  page?: number;
  size?: number;
}

// TODO: khớp endpoint với backend
export const moviesApi = {
  list: (params: MovieQuery) => api.get<Page<Movie>>("/movies", { params }).then((r) => r.data),
  detail: (id: string) => api.get<Movie>(`/movies/${id}`).then((r) => r.data),
};
