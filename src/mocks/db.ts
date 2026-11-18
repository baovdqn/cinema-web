// Trạng thái in-memory của mock API (reset khi reload trang).
import type { Booking, Movie, SeatStatus, Showtime, Ticket } from "@/types/api";
import { generateShowtimes, seatTemplates, seededRandom, seedMovies, seedUsers, type SeedUser } from "./data";

/** Booking lưu kèm userId (không trả ra ngoài). */
export type StoredBooking = Booking & { userId: number };

export interface IdempotentResult {
  status: number;
  bookingId: number;
  message?: string;
}

export const db = {
  users: [...seedUsers] as SeedUser[],
  movies: [...seedMovies] as Movie[],
  showtimes: generateShowtimes() as Showtime[],
  bookings: [] as StoredBooking[],
  tickets: [] as Ticket[],
  /** showtimeId -> seatId -> status */
  seatState: new Map<number, Map<number, SeatStatus>>(),
  idempotency: new Map<string, IdempotentResult>(),
  /** booking đang xử lý thanh toán (chặn double-pay khác key) */
  payInflight: new Set<number>(),
  nextUserId: 100,
  nextBookingId: 1,
  nextTicketId: 1,
};

export const roomOfShowtime = (s: Showtime) => s.room.id;

/** Lấy (và khởi tạo lười) trạng thái ghế của 1 suất: ~20% SOLD, ~3% HELD, theo seed = showtimeId. */
export function getSeatState(showtimeId: number) {
  let state = db.seatState.get(showtimeId);
  if (!state) {
    const showtime = db.showtimes.find((s) => s.id === showtimeId);
    state = new Map();
    if (showtime) {
      const rand = seededRandom(showtimeId * 7919);
      for (const t of seatTemplates) {
        const r = rand();
        const status: SeatStatus = r < 0.2 ? "SOLD" : r < 0.23 ? "HELD" : "AVAILABLE";
        state.set(showtime.room.id * 1000 + t.index, status);
      }
    }
    db.seatState.set(showtimeId, state);
  }
  return state;
}

export function releaseSeats(booking: StoredBooking) {
  const state = getSeatState(booking.showtimeId);
  for (const s of booking.seats) if (state.get(s.seatId) === "HELD") state.set(s.seatId, "AVAILABLE");
}

export function sellSeats(booking: StoredBooking) {
  const state = getSeatState(booking.showtimeId);
  for (const s of booking.seats) state.set(s.seatId, "SOLD");
}

/** Hết hạn lười: HELD quá expiresAt -> EXPIRED, trả ghế. Gọi mỗi khi đọc bookings/seats. */
export function sweepExpired(now = Date.now()) {
  for (const b of db.bookings) {
    if (b.status === "HELD" && new Date(b.expiresAt).getTime() <= now && !db.payInflight.has(b.id)) {
      b.status = "EXPIRED";
      releaseSeats(b);
    }
  }
}

export function toPublic(b: StoredBooking): Booking {
  const { userId: _userId, ...rest } = b;
  void _userId;
  return rest;
}
