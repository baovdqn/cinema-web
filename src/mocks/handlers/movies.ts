import { http, HttpResponse } from "msw";
import { env } from "@/lib/env";
import { db } from "../db";
import { errorResponse, readDelay } from "../utils";

const base = env.apiBaseUrl;

export const movieHandlers = [
  http.get(`${base}/movies`, async ({ request }) => {
    await readDelay();
    const status = new URL(request.url).searchParams.get("status");
    return HttpResponse.json(status ? db.movies.filter((m) => m.status === status) : db.movies);
  }),

  http.get(`${base}/movies/:id`, async ({ params }) => {
    await readDelay();
    const movie = db.movies.find((m) => m.id === Number(params.id));
    return movie ? HttpResponse.json(movie) : errorResponse(404, "Không tìm thấy phim");
  }),
];
