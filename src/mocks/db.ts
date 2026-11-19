// Trạng thái in-memory của mock API (reset khi reload trang).
import type { AdminSeat, Booking, Cinema, Movie, SeatPrices, SeatStatus, Showtime, ShowtimeSeat, Ticket } from "@/types/api";
import {
  cinemas as seedCinemas,
  generateShowtimes,
  roomsByCinema,
  SEAT_PRICE,
  seatTemplates,
  seededRandom,
  seedMovies,
  seedUsers,
  type SeedUser,
} from "./data";

export interface StoredCinema extends Cinema {
  isActive: boolean;
}
/** Phòng + sơ đồ ghế. seatId = roomId * 1000 + vị trí trong `seats`. */
export interface StoredRoom {
  id: number;
  cinemaId: number;
  name: string;
  isActive: boolean;
  seats: AdminSeat[];
}

const seedSeats: AdminSeat[] = seatTemplates.map(({ seatRow, seatNumber, seatType }) => ({ seatRow, seatNumber, seatType }));
const seedRooms: StoredRoom[] = seedCinemas.flatMap((c) =>
  roomsByCinema[c.id].map((r) => ({ id: r.id, cinemaId: c.id, name: r.name, isActive: true, seats: seedSeats })),
);
const seedShowtimes = generateShowtimes() as Showtime[];

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
  showtimes: seedShowtimes,
  cinemas: seedCinemas.map((c) => ({ ...c, isActive: true })) as StoredCinema[],
  rooms: seedRooms,
  /** Giá theo loại ghế của từng suất do admin tạo; suất seed dùng SEAT_PRICE. */
  showtimePrices: new Map<number, SeatPrices>(),
  bookings: [] as StoredBooking[],
  tickets: [] as Ticket[],
  /** showtimeId -> seatId -> status */
  seatState: new Map<number, Map<number, SeatStatus>>(),
  idempotency: new Map<string, IdempotentResult>(),
  /** booking đang xử lý thanh toán (chặn double-pay khác key) */
  payInflight: new Set<number>(),
  nextUserId: 100,
  nextMovieId: Math.max(...seedMovies.map((m) => m.id)) + 1,
  nextCinemaId: Math.max(...seedCinemas.map((c) => c.id)) + 1,
  nextRoomId: Math.max(...seedRooms.map((r) => r.id)) + 1,
  nextShowtimeId: Math.max(...seedShowtimes.map((s) => s.id)) + 1,
  nextBookingId: 1,
  nextTicketId: 1,
};

export const roomOfShowtime = (s: Showtime) => s.room.id;

export const pricesOf = (showtimeId: number): SeatPrices => db.showtimePrices.get(showtimeId) ?? SEAT_PRICE;

/** Toàn bộ ghế của suất (theo sơ đồ phòng + giá của suất). */
export function showtimeSeats(showtime: Showtime): Omit<ShowtimeSeat, "status">[] {
  const room = db.rooms.find((r) => r.id === showtime.room.id);
  const prices = pricesOf(showtime.id);
  return (room?.seats ?? []).map((s, index) => ({
    seatId: showtime.room.id * 1000 + index,
    seatRow: s.seatRow,
    seatNumber: s.seatNumber,
    seatType: s.seatType,
    price: prices[s.seatType],
  }));
}

/** Lấy (và khởi tạo lười) trạng thái ghế của 1 suất: ~20% SOLD, ~3% HELD, theo seed = showtimeId. */
export function getSeatState(showtimeId: number) {
  let state = db.seatState.get(showtimeId);
  if (!state) {
    const showtime = db.showtimes.find((s) => s.id === showtimeId);
    state = new Map();
    if (showtime) {
      const rand = seededRandom(showtimeId * 7919);
      for (const t of showtimeSeats(showtime)) {
        const r = rand();
        const status: SeatStatus = r < 0.2 ? "SOLD" : r < 0.23 ? "HELD" : "AVAILABLE";
        state.set(t.seatId, status);
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
