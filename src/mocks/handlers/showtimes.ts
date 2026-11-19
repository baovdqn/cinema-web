import { http, HttpResponse } from "msw";
import { env } from "@/lib/env";
import type { ShowtimeSeat } from "@/types/api";
import { ICT_OFFSET_MS } from "../data";
import { db, getSeatState, showtimeSeats, sweepExpired } from "../db";
import { errorResponse, readDelay } from "../utils";

const base = env.apiBaseUrl;

/** Ngày (YYYY-MM-DD) theo giờ Asia/Ho_Chi_Minh của 1 thời điểm ISO UTC. */
const ictDate = (iso: string) => new Date(new Date(iso).getTime() + ICT_OFFSET_MS).toISOString().slice(0, 10);

export const showtimeHandlers = [
  http.get(`${base}/showtimes`, async ({ request }) => {
    await readDelay();
    const q = new URL(request.url).searchParams;
    const movieId = q.get("movieId");
    const date = q.get("date");
    const isActive = (s: (typeof db.showtimes)[number]) =>
      db.cinemas.find((c) => c.id === s.cinema.id)?.isActive !== false &&
      db.rooms.find((r) => r.id === s.room.id)?.isActive !== false;
    const list = db.showtimes.filter(
      (s) => isActive(s) && (!movieId || s.movieId === Number(movieId)) && (!date || ictDate(s.startTime) === date),
    );
    return HttpResponse.json(list);
  }),

  http.get(`${base}/showtimes/:id`, async ({ params }) => {
    await readDelay();
    const showtime = db.showtimes.find((s) => s.id === Number(params.id));
    return showtime ? HttpResponse.json(showtime) : errorResponse(404, "Không tìm thấy suất chiếu");
  }),

  http.get(`${base}/showtimes/:id/seats`, async ({ params }) => {
    await readDelay();
    sweepExpired();
    const showtime = db.showtimes.find((s) => s.id === Number(params.id));
    if (!showtime) return errorResponse(404, "Không tìm thấy suất chiếu");
    const state = getSeatState(showtime.id);
    const seats: ShowtimeSeat[] = showtimeSeats(showtime).map((t) => ({
      ...t,
      status: state.get(t.seatId) ?? "AVAILABLE",
    }));
    return HttpResponse.json(seats);
  }),
];
