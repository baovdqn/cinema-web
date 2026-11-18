"use client";

import { useQuery } from "@tanstack/react-query";
import { moviesApi, type MovieQuery } from "./api";

export const movieKeys = {
  all: ["movies"] as const,
  list: (q: MovieQuery) => [...movieKeys.all, "list", q] as const,
  detail: (id: string) => [...movieKeys.all, "detail", id] as const,
};

export function useMovies(query: MovieQuery) {
  return useQuery({ queryKey: movieKeys.list(query), queryFn: () => moviesApi.list(query) });
}

export function useMovie(id: string) {
  return useQuery({ queryKey: movieKeys.detail(id), queryFn: () => moviesApi.detail(id), enabled: !!id });
}
