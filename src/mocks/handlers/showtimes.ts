import { http, HttpResponse } from "msw";
import { env } from "@/lib/env";
import type { ShowtimeSeat } from "@/types/api";
import { ICT_OFFSET_MS, seatTemplates } from "../data";
import { db, getSeatState, sweepExpired } from "../db";
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
    const list = db.showtimes.filter(
      (s) => (!movieId || s.movieId === Number(movieId)) && (!date || ictDate(s.startTime) === date),
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
    const seats: ShowtimeSeat[] = seatTemplates.map((t) => {
      const seatId = showtime.room.id * 1000 + t.index;
      return {
        seatId,
        seatRow: t.seatRow,
        seatNumber: t.seatNumber,
        seatType: t.seatType,
        status: state.get(seatId) ?? "AVAILABLE",
        price: t.price,
      };
    });
    return HttpResponse.json(seats);
  }),
];
